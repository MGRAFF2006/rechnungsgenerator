window.jsPDF = window.jspdf.jsPDF;

// Logo Vorschau
document.getElementById("logo-upload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      const preview = document.getElementById("logo-preview");
      preview.innerHTML = "";
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

// Aktuelle Datum automatisch eintragen
document.getElementById("invoice-date").valueAsDate = new Date();

// Berechnung der Kosten
function calculateTotals() {
  const rows = document.querySelectorAll("#invoice-items tbody tr");
  let subtotal = 0;
  let vatTotal = 0;

  rows.forEach((row) => {
    const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    const vat = parseFloat(row.querySelector(".item-vat").value) || 0;

    const rowTotal = quantity * price;
    const rowVat = rowTotal * (vat / 100);

    row.querySelector(".item-total").textContent = rowTotal.toFixed(2) + " €";

    subtotal += rowTotal;
    vatTotal += rowVat;
  });

  const total = subtotal + vatTotal;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2) + " €";
  document.getElementById("vat-total").textContent = vatTotal.toFixed(2) + " €";
  document.getElementById("total-amount").textContent = total.toFixed(2) + " €";
}

// Event-Listener für Eingabeänderungen
document.getElementById("invoice-items").addEventListener("input", function (e) {
  if (
    e.target.classList.contains("item-quantity") ||
    e.target.classList.contains("item-price") ||
    e.target.classList.contains("item-vat")
  ) {
    calculateTotals();
  }
});

// Position entfernen
document.getElementById("invoice-items").addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-item")) {
    const rows = document.querySelectorAll("#invoice-items tbody tr");
    if (rows.length > 1) {
      e.target.closest("tr").remove();
      updateRowNumbers();
      calculateTotals();
    } else {
      alert("Es muss mindestens eine Position vorhanden sein.");
    }
  }
});

// Position hinzufügen
document.getElementById("add-item").addEventListener("click", function () {
  const tbody = document.querySelector("#invoice-items tbody");
  const rowCount = tbody.children.length + 1;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="text" class="item-description" required></td>
    <td><input type="number" class="item-quantity" min="1" value="1" required></td>
    <td><input type="number" class="item-price" min="0" step="0.01" required></td>
    <td><input type="number" class="item-vat" min="0" value="19" required></td>
    <td class="item-total">0.00 €</td>
    <td><button type="button" class="remove-item">Entfernen</button></td>
  `;

  tbody.appendChild(newRow);
});

// Zeilennummern aktualisieren
function updateRowNumbers() {
  const rows = document.querySelectorAll("#invoice-items tbody tr");
  rows.forEach((row, index) => {
    row.cells[0].textContent = index + 1;
  });
}

// Hilfsfunktionen
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE");
}

// Verbesserte Validierungsfunktion
function validateForm() {
  // Überprüfen der Pflichtfelder
  const requiredFields = [
    "company-name",
    "company-address",
    "company-contact",
    "customer-name",
    "customer-address",
    "invoice-number",
    "invoice-date",
  ];

  let isValid = true;
  let errorMessage = "Bitte füllen Sie folgende Felder aus:\n";
  
  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      field.style.borderColor = "red";
      isValid = false;
      
      // Benutzerfreundlicher Feldname für die Fehlermeldung
      const labelText = field.previousElementSibling.textContent.replace(':', '');
      errorMessage += `- ${labelText}\n`;
    } else {
      field.style.borderColor = "";
    }
  });

  // Überprüfen der Rechnungspositionen
  let hasInvalidItems = false;
  const rows = document.querySelectorAll("#invoice-items tbody tr");
  rows.forEach((row, index) => {
    const description = row.querySelector(".item-description");
    const quantity = row.querySelector(".item-quantity");
    const price = row.querySelector(".item-price");
    let rowInvalid = false;

    if (!description.value.trim()) {
      description.style.borderColor = "red";
      rowInvalid = true;
    } else {
      description.style.borderColor = "";
    }

    if (!quantity.value || parseFloat(quantity.value) <= 0) {
      quantity.style.borderColor = "red";
      rowInvalid = true;
    } else {
      quantity.style.borderColor = "";
    }

    if (!price.value || parseFloat(price.value) < 0) {
      price.style.borderColor = "red";
      rowInvalid = true;
    } else {
      price.style.borderColor = "";
    }
    
    if (rowInvalid && !hasInvalidItems) {
      hasInvalidItems = true;
      errorMessage += `- Position ${index + 1} enthält ungültige Daten\n`;
    }
  });

  if (!isValid || hasInvalidItems) {
    alert(errorMessage);
    return false;
  }

  return true;
}

// Gemeinsame Funktion, die das PDF erzeugt und als Objekt zurückgibt
function createPDF() {
  if (!validateForm()) return null;

  // PDF mit A4-Format erstellen
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Seitenrand reduziert für mehr Platz
  const contentWidth = pageWidth - 2 * margin;
  
  // Hintergrund komplett weiß lassen für sauberes Design
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Blaue Farbe für Akzente
  const accentColor = [41, 128, 185]; // etwas dunkleres Blau für bessere Lesbarkeit
  
  let y = margin;

  // Firmenlogo
  const logoImg = document.querySelector("#logo-preview img");
  if (logoImg) {
    const imgData = logoImg.src;
    // Logo oben links mit angepasster Größe
    const imgWidth = Math.min(45, contentWidth / 3);
    const imgHeight = Math.min(imgWidth * 0.6, 20); // Limit height
    doc.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight);
    
    // Adjust y position to ensure company info starts below the logo
    y = margin + imgHeight + 5; // 5mm spacing after logo
  } else {
    // If no logo, start company info from the top margin
    y = margin;
  }

  // Firmeninformationen links ausrichten
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  
  const companyName = document.getElementById("company-name").value;
  const companyAddress = document.getElementById("company-address").value.split("\n");
  const companyContact = document.getElementById("company-contact").value.split("\n");
  
  // Firmenname hervorheben
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, margin, y);
  y += 5; // Reduzierter Abstand
  
  // Zurück zur normalen Schriftart für die Adresse
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  companyAddress.forEach(line => {
    doc.text(line, margin, y);
    y += 4;
  });
  
  // Ein bisschen Abstand vor Kontaktdaten
  y += 1;
  
  companyContact.forEach(line => {
    doc.text(line, margin, y);
    y += 4;
  });

  // Horizontale Linie unter Firmendaten - optimierter Abstand
  y = Math.max(y, 65);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y-8, pageWidth - margin, y-8);

  // Rechnungsüberschrift und Details oben rechts
  // RECHNUNG in Großbuchstaben und blau
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("RECHNUNG", pageWidth - margin, margin + 5, { align: "right" });
  
  // Horizontale Linie unter "RECHNUNG"
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth/2, margin + 10, pageWidth - margin, margin + 10);
  
  // Rechnungsdaten
  doc.setTextColor(70, 70, 70);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Rechnungsnummer: " + document.getElementById("invoice-number").value,
    pageWidth - margin,
    margin + 20,
    { align: "right" }
  );
  doc.text(
    "Datum: " + formatDate(document.getElementById("invoice-date").value),
    pageWidth - margin,
    margin + 26,
    { align: "right" }
  );

  // Kundeninformationen in einem leicht abgesetzten Bereich - optimierter Abstand
  y = Math.max(y, 75); // Reduzierter Abstand
  doc.setFillColor(247, 249, 250); // Sehr helles Grau für bessere Lesbarkeit
  doc.rect(margin, y, contentWidth, 22, "F"); // Höhe reduziert
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Rechnungsempfänger:", margin + 5, y + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(document.getElementById("customer-name").value, margin + 5, y + 12);
  
  const customerAddressLines = document.getElementById("customer-address").value.split("\n");
  let customerY = y + 16;
  customerAddressLines.forEach(line => {
    if (customerY - y < 22) { 
      doc.text(line, margin + 5, customerY);
      customerY += 4; // Reduzierter Zeilenabstand
    }
  });

  y += 30; // Reduzierter Abstand nach Kundenbereich

  // Zahlungsbedingungen
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Zahlungsbedingungen: " + document.getElementById("payment-terms").value, margin, y);
  
  y += 8; // Reduzierter Abstand vor Tabelle

  // Rechnungspositionen als Tabelle mit optimiertem Design
  const rows = document.querySelectorAll("#invoice-items tbody tr");
  const tableData = [];
  
  rows.forEach((row, index) => {
    const description = row.querySelector(".item-description").value;
    const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    const vat = parseFloat(row.querySelector(".item-vat").value) || 0;
    const total = quantity * price;

    tableData.push([
      index + 1,
      description,
      quantity.toString(),
      price.toFixed(2) + " €",
      vat.toString() + "%",
      total.toFixed(2) + " €",
    ]);
  });

  // Tabelle mit optimierten Stilen, Abständen und Spaltenbreiten
  doc.autoTable({
    startY: y,
    head: [[
      { content: 'Pos', styles: { halign: 'center' } },
      { content: 'Beschreibung', styles: { halign: 'left' } },
      { content: 'Menge', styles: { halign: 'center' } },
      { content: 'Einzelpreis', styles: { halign: 'right' } },
      { content: 'MwSt', styles: { halign: 'center' } },
      { content: 'Gesamt', styles: { halign: 'right' } }
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: accentColor, 
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      lineWidth: 0.1,
      cellPadding: { top: 5, right: 3, bottom: 5, left: 3 } // Reduziertes Padding
    },
    bodyStyles: {
      fontSize: 9,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 } // Reduziertes Padding
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },           // Pos. - korrigierte Breite
      1: { halign: 'left', cellWidth: 'auto' },         // Beschreibung - automatische Breite
      2: { halign: 'center', cellWidth: 18 },           // Menge - ausreichend für "Menge" 
      3: { halign: 'right', cellWidth: 25 },            // Einzelpreis - optimiert
      4: { halign: 'center', cellWidth: 15 },           // MwSt - schmaler
      5: { halign: 'right', cellWidth: 25 }             // Gesamt - optimiert
    },
    margin: { left: margin, right: margin },
    styles: {
      overflow: 'linebreak',
      fontSize: 9
    },
    didDrawPage: function(data) {
      // Fußzeile mit Seitennummerierung
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Seite ' + doc.getCurrentPageInfo().pageNumber + ' von ' + doc.getNumberOfPages(),
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
      
      // Fußzeile mit Firmendaten
      const footerText = companyName + ' • ' + companyAddress[0];
      doc.text(footerText, pageWidth/2, pageHeight - 8, { align: 'center' });
    }
  });

  y = doc.lastAutoTable.finalY + 10; // Reduzierter Abstand nach Tabelle

  // Zusammenfassung rechts ausgerichtet und optimiert
  const subtotal = parseFloat(
    document.getElementById("subtotal").textContent.replace(" €", "")
  );
  const vatTotal = parseFloat(
    document.getElementById("vat-total").textContent.replace(" €", "")
  );
  const total = parseFloat(
    document.getElementById("total-amount").textContent.replace(" €", "")
  );

  // Sammlung der Zusammenfassungsdaten
  const summaryX = pageWidth - margin - 80;
  const summaryWidth = 80;
  
  // Weißer Hintergrund für die Zusammenfassung
  doc.setFillColor(255, 255, 255);
  
  // Zusammenfassung durch Linien statt Box trennen
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  
  // Zwischensumme
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  
  doc.text("Zwischensumme:", summaryX, y);
  doc.text(subtotal.toFixed(2) + " €", pageWidth - margin, y, { align: "right" });
  
  y += 5; // Reduzierter Abstand
  // MwSt.
  doc.text("MwSt:", summaryX, y);
  doc.text(vatTotal.toFixed(2) + " €", pageWidth - margin, y, { align: "right" });
  
  // Linie vor Gesamtbetrag
  y += 2; // Reduzierter Abstand
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.line(summaryX, y, pageWidth - margin, y);
  
  y += 5; // Reduzierter Abstand
  // Gesamtbetrag
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Gesamtbetrag:", summaryX, y);
  doc.text(total.toFixed(2) + " €", pageWidth - margin, y, { align: "right" });

  y += 20; // Reduzierter Abstand

  // Zusätzliche Informationen in Kästen organisiert
  const notes = document.getElementById("notes").value;
  const bankDetails = document.getElementById("bank-details").value;
  const taxId = document.getElementById("company-tax").value;
  
  // Neue Seite für Zusatzinfos, wenn nötig
  if (y > pageHeight - 75) {
    doc.addPage();
    y = margin;
  }
  
  // Hinweise/Notizen
  if (notes) {
    doc.setFillColor(247, 249, 250);
    doc.rect(margin, y, contentWidth, 20, 'F'); // Reduzierte Höhe
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Anmerkungen:", margin + 5, y + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    
    const notesLines = notes.split("\n");
    let notesY = y + 12;
    notesLines.forEach((line) => {
      if (notesY - y < 20) {
        doc.text(line, margin + 5, notesY);
        notesY += 4; // Reduzierter Zeilenabstand
      }
    });
    
    y += 25; // Reduzierter Abstand
  }

  // Zwei Spalten für Bank- und Steuerinformationen
  const halfWidth = (contentWidth / 2) - 5;
  
  // Bankverbindung und Steuerinformationen nebeneinander
  if (bankDetails || taxId) {
    // Bankverbindung
    if (bankDetails) {
      doc.setFillColor(247, 249, 250);
      doc.rect(margin, y, halfWidth, 20, 'F'); // Reduzierte Höhe
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("Bankverbindung:", margin + 5, y + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      
      const bankLines = bankDetails.split("\n");
      let bankY = y + 12;
      bankLines.forEach((line) => {
        if (bankY - y < 20) {
          doc.text(line, margin + 5, bankY);
          bankY += 4; // Reduzierter Zeilenabstand
        }
      });
    }

    // Steuerinformationen
    if (taxId) {
      doc.setFillColor(247, 249, 250);
      doc.rect(margin + halfWidth + 10, y, halfWidth, 20, 'F'); // Reduzierte Höhe
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("Steuerinformationen:", margin + halfWidth + 15, y + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.text("Steuernummer/USt-ID: " + taxId, margin + halfWidth + 15, y + 12);
    }
  }

  return doc;
}

// Vorschau öffnen
document.getElementById("preview-invoice").addEventListener("click", function () {
  const doc = createPDF();
  if (!doc) return;
  
  // PDF als Datenstring holen
  const pdfData = doc.output('datauristring');
  
  // Vorschau Container vorbereiten
  const previewContainer = document.getElementById("preview-container");
  const previewContent = document.getElementById("invoice-preview");
  
  // Embed PDF in einem iframe
  previewContent.innerHTML = `
    <iframe 
      src="${pdfData}" 
      style="width: 100%; height: 75vh; border: none;" 
      title="Rechnungsvorschau">
    </iframe>
  `;
  
  previewContainer.classList.remove("hidden");
});

// Vorschau schließen
document.getElementById("close-preview").addEventListener("click", function () {
  document.getElementById("preview-container").classList.add("hidden");
});

// Zusätzlich: Schließen durch Klick außerhalb des Inhaltsbereichs
document.getElementById("preview-container").addEventListener("click", function(e) {
  // Wenn auf den Container außerhalb des Inhalts geklickt wird
  if (e.target === document.getElementById("preview-container")) {
    document.getElementById("preview-container").classList.add("hidden");
  }
});

// Zusätzlich: Schließen mit Escape-Taste
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && !document.getElementById("preview-container").classList.contains("hidden")) {
    document.getElementById("preview-container").classList.add("hidden");
  }
});
