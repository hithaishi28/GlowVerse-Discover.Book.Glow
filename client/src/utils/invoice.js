import { jsPDF } from 'jspdf';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function safe(value, fallback = 'Not available') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function safeFilePart(value) {
  return safe(value, 'invoice')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'invoice';
}

function drawLogo(doc, x, y) {
  doc.setFillColor(190, 52, 85);
  doc.circle(x, y, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GV', x, y + 3, { align: 'center' });
}

function lineItemRows(items) {
  return items.filter(Boolean).map((item, index) => ({
    serial: index + 1,
    name: safe(item.name, 'Salon service'),
    duration: item.durationMinutes ? `${item.durationMinutes} min` : '-',
    amount: Number(item.price || 0)
  }));
}

export function buildInvoiceData({ user, salon, booking, payment, service, stylist, selected, convenienceFee, total }) {
  if (!booking) throw new Error('Booking confirmation is missing.');
  if (!salon) throw new Error('Salon details are missing.');
  const bookedService = service || booking.service;
  if (!bookedService) throw new Error('Selected service is missing.');

  const fee = Number(booking.convenienceFee ?? convenienceFee ?? 0);
  const serviceAmount = Number(booking.service?.price ?? bookedService.price ?? 0);
  const discount = Number(booking.discount || 0);
  const services = lineItemRows([
    { ...bookedService, price: serviceAmount },
    discount > 0 ? { name: 'Membership discount', durationMinutes: null, price: -discount } : null,
    fee > 0 ? { name: 'Platform convenience fee', durationMinutes: null, price: fee } : null
  ]);
  const totalPaid = Number(payment?.amount ?? booking.amount ?? total ?? services.reduce((sum, row) => sum + row.amount, 0));
  const gstIncluded = Math.round((totalPaid * 18) / 118);
  const taxableValue = totalPaid - gstIncluded;

  return {
    invoiceNumber: booking.invoiceNumber || `GV-${Date.now()}`,
    bookingId: booking._id || booking.id || booking.invoiceNumber || `BOOK-${Date.now()}`,
    issuedAt: booking.paidAt || new Date().toLocaleString(),
    customerName: user?.name || 'GlowVerse Customer',
    customerAge: user?.age || 'Not provided',
    customerEmail: user?.email || 'Not provided',
    salonName: salon.name,
    salonAddress: salon.address,
    appointmentDate: selected?.date || booking.date || 'Not selected',
    appointmentSlot: selected?.slot || booking.slot || 'Not selected',
    stylistName: stylist?.name || booking.stylist?.name || 'Any available stylist',
    services,
    paymentId: payment?.providerPaymentId || payment?.transactionId || booking.transactionId || payment?.providerOrderId || booking.paymentId || 'Pending payment',
    paymentMethod: (payment?.method || selected?.paymentMethod || 'upi').toUpperCase(),
    taxableValue,
    gstIncluded,
    totalPaid
  };
}

export function generateInvoicePdf(invoice) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const margin = 42;

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, width, 132, 'F');
  drawLogo(doc, margin + 9, 42);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('GlowVerse', margin + 28, 48);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Discover. Book. Glow.', margin + 28, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TAX INVOICE', width - margin, 46, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, width - margin, 66, { align: 'right' });
  doc.text(`Issued: ${invoice.issuedAt}`, width - margin, 82, { align: 'right' });

  doc.setTextColor(17, 24, 39);
  doc.setFillColor(248, 245, 239);
  doc.roundedRect(margin, 156, width - margin * 2, 108, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Customer', margin + 18, 182);
  doc.text('Booking', width / 2 + 4, 182);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${invoice.customerName}`, margin + 18, 204);
  doc.text(`Age: ${invoice.customerAge}`, margin + 18, 220);
  doc.text(`Email: ${invoice.customerEmail}`, margin + 18, 236);
  doc.text(`Booking ID: ${invoice.bookingId}`, width / 2 + 4, 204);
  doc.text(`Appointment: ${invoice.appointmentDate}, ${invoice.appointmentSlot}`, width / 2 + 4, 220);
  doc.text(`Stylist: ${invoice.stylistName}`, width / 2 + 4, 236);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Salon Details', margin, 300);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.salonName, margin, 320);
  doc.text(doc.splitTextToSize(invoice.salonAddress || 'Address not available', width - margin * 2), margin, 336);

  const tableTop = 390;
  doc.setFillColor(190, 52, 85);
  doc.roundedRect(margin, tableTop, width - margin * 2, 30, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('#', margin + 12, tableTop + 20);
  doc.text('Service', margin + 44, tableTop + 20);
  doc.text('Duration', width - 190, tableTop + 20);
  doc.text('Amount', width - margin - 8, tableTop + 20, { align: 'right' });

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  let y = tableTop + 54;
  invoice.services.forEach((row) => {
    doc.text(String(row.serial), margin + 12, y);
    doc.text(doc.splitTextToSize(row.name, 250), margin + 44, y);
    doc.text(row.duration, width - 190, y);
    doc.text(money(row.amount), width - margin - 8, y, { align: 'right' });
    y += 28;
  });

  y += 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(width - 260, y, width - margin, y);
  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.text('Taxable value', width - 260, y);
  doc.text(money(invoice.taxableValue), width - margin - 8, y, { align: 'right' });
  y += 20;
  doc.text('GST included (18%)', width - 260, y);
  doc.text(money(invoice.gstIncluded), width - margin - 8, y, { align: 'right' });
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total paid', width - 260, y);
  doc.text(money(invoice.totalPaid), width - margin - 8, y, { align: 'right' });

  y += 46;
  doc.setFillColor(248, 245, 239);
  doc.roundedRect(margin, y, width - margin * 2, 78, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Payment Details', margin + 18, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment ID: ${invoice.paymentId}`, margin + 18, y + 46);
  doc.text(`Payment method: ${invoice.paymentMethod}`, margin + 18, y + 62);
  doc.text('Status: Paid', width - margin - 18, y + 46, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(95, 99, 104);
  doc.text('This is a computer-generated invoice for a confirmed GlowVerse salon appointment.', margin, 790);
  return doc;
}

export async function downloadInvoicePdf(invoice) {
  const doc = generateInvoicePdf(invoice);
  const blob = doc.output('blob');
  if (!(blob instanceof Blob) || blob.size < 1000 || blob.type !== 'application/pdf') {
    throw new Error('Invoice PDF could not be generated.');
  }

  const fileName = `Invoice_${safeFilePart(invoice.invoiceNumber || invoice.bookingId)}.pdf`;
  if (!document?.body) throw new Error('Browser download is unavailable.');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 60000);
  return { blob, fileName };
}
