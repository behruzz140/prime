// print-receipt.js (ESM)
import { ipcMain, app } from "electron";
import PDFDocument from "pdfkit";
import fs from "fs";
import ptp from "pdf-to-printer";
import path from "path";
import qr from "qr-image";

// Если вы печатаете на 58мм — лучше держать миллиметры в одном месте
const mm = (v) => v * 2.83464567;

export function registerPrintEvent() {
  ipcMain.on("print-receipt", async (_event, info) => {
    if (!info || !info.id) {
      console.error("Ошибка: некорректные данные для печати", info);
      return;
    }

    // В проде путь существует и доступен на запись
    const pdfPath = path.join(app.getPath("userData"), "receipt.pdf");

    // Размер чека 58мм x ~170мм (подрежется принтером, это ок)
    const width = mm(58);
    const height = mm(170);

    // Генерируем PDF
    const doc = new PDFDocument({
      size: [width, height],
      margins: { top: 5, left: 5, right: 5, bottom: 5 },
    });

    // Пишем PDF на диск
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Шрифты: в проде путь к системным шрифтам ок на Windows, но обернём в try/catch
    try {
      doc.font("C:\\Windows\\Fonts\\arialbd.ttf");
    } catch {
      /* fallback */
    }
    doc.fillColor("black");

    // Заголовок
    doc.fontSize(10).text(`${info.checkInfo.emporium.name}`, { align: "center" });
    doc.fontSize(10).text(`${info.checkInfo.emporium.address}`, { align: "center" }).moveDown(1);
    doc.text("----------------------------", { align: "center" });
    doc.fontSize(14).text(`Chek: #${info.id}`, { align: "center" });
    doc.text("-----------------------", { align: "center" });
    doc.moveDown(1);

    // Поля
    const vat = info.checkInfo.items?.[0]?.vat_percent ?? 0;
    doc.fontSize(10).text(`Davlat raqami: ${info.plateNumber || "Mavjud emas"}`, { align: "left" });
    doc.moveDown(0.3).text(`Narxi: ${info.price}`, { align: "left" });
    doc.moveDown(0.3).text(`To'lov turi: Naqt`, { align: "left" });
    doc
      .moveDown(0.3)
      .text(`Kirish vaqti: ${new Date(info.startTime).toLocaleString()}`, { align: "left" });
    doc.moveDown(0.3).text(`QQS: ${vat}`, { align: "left" });
    doc.moveDown(0.3).text(`STIR: ${info.checkInfo.emporium.tin}`, { align: "left" });
    doc.moveDown(0.3).text(`FM: ${info.checkInfo.ofd.terminal_id}`, { align: "left" });
    doc.moveDown(1).text("----------------------------", { align: "center" });
    doc.moveDown(1);

    // ✅ QR без файловой системы — напрямую буфером
    const qrUrl = info.checkInfo.ofd.url;
    if (qrUrl) {
      const qrPngBuffer = qr.imageSync(qrUrl, { type: "png", margin: 1, size: 4 });
      // Квадрат по ширине ленты
      doc.image(qrPngBuffer, 0, height - width, { width, height: width });
    } else {
      console.warn("QR URL пустой");
    }

    // Завершаем PDF
    doc.end();

    // Дожидаемся, пока файл **реально** запишется, только потом печатаем
    stream.on("finish", async () => {
      try {
        // Можно указать конкретный принтер: { printer: "POS-58" }
        await ptp.print(pdfPath, { options: { scale: "shrink" } });
        console.log("Печать завершена");
      } catch (err) {
        console.error("Ошибка печати:", err);
      }
    });

    stream.on("error", (e) => {
      console.error("Ошибка записи PDF:", e);
    });
  });
}
