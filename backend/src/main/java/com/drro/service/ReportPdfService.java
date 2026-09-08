package com.drro.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * ReportPdfService — generates publication-grade, structured PDF reports with
 * executive KPI summaries, inventory utilization, unmet demand, and baseline algorithm comparisons.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportPdfService {

    private final ReportService reportService;

    // Palette Colors
    private static final Color PRIMARY_COLOR = new Color(30, 41, 59);     // Slate 800
    private static final Color ACCENT_COLOR  = new Color(232, 90, 60);    // DRRO Coral
    private static final Color HEADER_BG     = new Color(241, 245, 249);  // Slate 100
    private static final Color ALT_ROW_BG    = new Color(248, 250, 252);  // Slate 50
    private static final Color BORDER_COLOR  = new Color(226, 232, 240);  // Slate 200
    private static final Color DANGER_COLOR  = new Color(220, 38, 38);    // Red 600
    private static final Color SUCCESS_COLOR = new Color(22, 163, 74);    // Green 600

    public byte[] exportOperationalSummary() {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter writer = PdfWriter.getInstance(document, output);
            document.open();

            // 1. Header Banner
            addHeaderBanner(document);

            // 2. Executive KPI Summary Grid
            addKpiSummary(document);

            // 3. Unmet Demand Section
            addUnmetDemandSection(document);

            // 4. Resource Center Utilization Section
            addUtilizationSection(document);

            // 5. Algorithm Comparison Section
            addAlgorithmComparisonSection(document);

            // 6. Footer Note
            addFooter(document);

            document.close();
            return output.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate PDF report", ex);
            throw new IllegalStateException("Unable to generate the PDF report: " + ex.getMessage(), ex);
        }
    }

    private void addHeaderBanner(Document doc) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{70, 30});
        headerTable.setSpacingAfter(16);

        // Left Title
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setPadding(0);

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, ACCENT_COLOR);
        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
        titleCell.addElement(new Paragraph("DISASTER RESOURCE RESPONSE OPTIMIZER", titleFont));
        titleCell.addElement(new Paragraph("Executive Operational Briefing & Logistics Report", subFont));
        headerTable.addCell(titleCell);

        // Right Meta
        PdfPCell metaCell = new PdfPCell();
        metaCell.setBorder(Rectangle.NO_BORDER);
        metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        metaCell.setPadding(0);

        Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY);
        String nowStr = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm z").format(ZonedDateTime.now());
        Paragraph p = new Paragraph("Generated: " + nowStr + "\nSecurity: OFFICIAL RESPONSE", metaFont);
        p.setAlignment(Element.ALIGN_RIGHT);
        metaCell.addElement(p);
        headerTable.addCell(metaCell);

        doc.add(headerTable);

        // Divider
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell divCell = new PdfPCell();
        divCell.setBackgroundColor(ACCENT_COLOR);
        divCell.setFixedHeight(2f);
        divCell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(divCell);
        divider.setSpacingAfter(14);
        doc.add(divider);
    }

    private void addKpiSummary(Document doc) throws DocumentException {
        Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, PRIMARY_COLOR);
        Paragraph title = new Paragraph("1. Executive Operational Metrics", sectionTitleFont);
        title.setSpacingAfter(8);
        doc.add(title);

        Map<String, Object> metrics = reportService.metrics();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(18);

        addKpiBox(kpiTable, "Active Disasters", String.valueOf(metrics.getOrDefault("activeDisasters", 0)));
        addKpiBox(kpiTable, "Open Relief Requests", String.valueOf(metrics.getOrDefault("openRequests", 0)));
        addKpiBox(kpiTable, "Pending Approvals", String.valueOf(metrics.getOrDefault("pendingApprovals", 0)));
        addKpiBox(kpiTable, "Active Dispatches", String.valueOf(metrics.getOrDefault("activeDispatches", 0)));

        addKpiBox(kpiTable, "Fulfillment Rate", metrics.getOrDefault("fulfillmentRatePct", 0) + "%");
        addKpiBox(kpiTable, "Total Allocations", String.valueOf(metrics.getOrDefault("totalAllocations", 0)));
        addKpiBox(kpiTable, "Avg Priority Score", String.valueOf(metrics.getOrDefault("avgPriorityScore", 0)));
        addKpiBox(kpiTable, "Low Stock Alerts", String.valueOf(metrics.getOrDefault("lowStockAlerts", 0)));

        doc.add(kpiTable);
    }

    private void addKpiBox(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(HEADER_BG);
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Font valFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, PRIMARY_COLOR);
        Font lblFont = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Color.GRAY);

        Paragraph valP = new Paragraph(value, valFont);
        valP.setAlignment(Element.ALIGN_CENTER);
        Paragraph lblP = new Paragraph(label.toUpperCase(), lblFont);
        lblP.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(valP);
        cell.addElement(lblP);
        table.addCell(cell);
    }

    private void addUnmetDemandSection(Document doc) throws DocumentException {
        Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, PRIMARY_COLOR);
        Paragraph title = new Paragraph("2. Critical Unmet Demand by Location & Resource", sectionTitleFont);
        title.setSpacingAfter(8);
        doc.add(title);

        List<Map<String, Object>> unmet = reportService.unmetDemand();

        if (unmet.isEmpty()) {
            Paragraph p = new Paragraph("No unmet demand recorded at this time.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Color.GRAY));
            p.setSpacingAfter(14);
            doc.add(p);
            return;
        }

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{30, 25, 15, 15, 15});
        table.setSpacingAfter(18);

        addTableHeader(table, new String[]{"Affected Location", "Resource Required", "Unmet Qty", "Urgency", "Severity"});

        int count = 0;
        for (Map<String, Object> u : unmet) {
            Color rowBg = (count % 2 == 0) ? Color.WHITE : ALT_ROW_BG;
            String locName = String.valueOf(u.getOrDefault("locationName", "—"));
            String resName = String.valueOf(u.getOrDefault("resourceName", u.getOrDefault("resourceTypeName", "General")));
            String qty = String.valueOf(u.getOrDefault("unmetQty", "0"));
            String urgency = String.valueOf(u.getOrDefault("urgency", "NORMAL"));
            String sev = String.valueOf(u.getOrDefault("severity", "—"));

            addTableCell(table, locName, rowBg, Element.ALIGN_LEFT, false, null);
            addTableCell(table, resName, rowBg, Element.ALIGN_LEFT, true, null);
            addTableCell(table, qty, rowBg, Element.ALIGN_RIGHT, true, DANGER_COLOR);
            addTableCell(table, urgency, rowBg, Element.ALIGN_CENTER, false, null);
            addTableCell(table, sev + "/100", rowBg, Element.ALIGN_CENTER, false, null);

            count++;
            if (count >= 10) break; // Top 10 critical items
        }

        doc.add(table);
    }

    private void addUtilizationSection(Document doc) throws DocumentException {
        Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, PRIMARY_COLOR);
        Paragraph title = new Paragraph("3. Resource Center Stock & Utilization", sectionTitleFont);
        title.setSpacingAfter(8);
        doc.add(title);

        List<Map<String, Object>> util = reportService.utilization();

        if (util.isEmpty()) {
            Paragraph p = new Paragraph("No active resource centers found.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Color.GRAY));
            p.setSpacingAfter(14);
            doc.add(p);
            return;
        }

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{30, 18, 18, 18, 16});
        table.setSpacingAfter(18);

        addTableHeader(table, new String[]{"Resource Center", "Available Stock", "Reserved", "Dispatched", "Utilization %"});

        int count = 0;
        for (Map<String, Object> c : util) {
            Color rowBg = (count % 2 == 0) ? Color.WHITE : ALT_ROW_BG;
            String name = String.valueOf(c.getOrDefault("centerName", "—"));
            String avail = String.valueOf(c.getOrDefault("totalAvailable", "0"));
            String res = String.valueOf(c.getOrDefault("totalReserved", "0"));
            String disp = String.valueOf(c.getOrDefault("totalDispatched", "0"));
            String pct = String.valueOf(c.getOrDefault("utilizationPct", "0")) + "%";

            addTableCell(table, name, rowBg, Element.ALIGN_LEFT, true, null);
            addTableCell(table, avail, rowBg, Element.ALIGN_RIGHT, false, null);
            addTableCell(table, res, rowBg, Element.ALIGN_RIGHT, false, null);
            addTableCell(table, disp, rowBg, Element.ALIGN_RIGHT, false, null);
            addTableCell(table, pct, rowBg, Element.ALIGN_RIGHT, true, SUCCESS_COLOR);

            count++;
        }

        doc.add(table);
    }

    private void addAlgorithmComparisonSection(Document doc) throws DocumentException {
        Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, PRIMARY_COLOR);
        Paragraph title = new Paragraph("4. Allocation Algorithm Benchmark Evaluation", sectionTitleFont);
        title.setSpacingAfter(8);
        doc.add(title);

        List<Map<String, Object>> baseline = reportService.baselineComparison();

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{40, 20, 20, 20});
        table.setSpacingAfter(16);

        addTableHeader(table, new String[]{"Algorithm Strategy", "Allocations", "Avg Priority Score", "Avg Travel (Hrs)"});

        int count = 0;
        for (Map<String, Object> b : baseline) {
            Color rowBg = (count % 2 == 0) ? Color.WHITE : ALT_ROW_BG;
            String strat = String.valueOf(b.getOrDefault("strategy", "—")).replace('_', ' ');
            String num = String.valueOf(b.getOrDefault("allocationCount", 0));
            double score = Double.parseDouble(String.valueOf(b.getOrDefault("avgPriorityScore", 0.0)));
            double travel = Double.parseDouble(String.valueOf(b.getOrDefault("avgTravelHrs", 0.0)));

            boolean isGreedy = strat.contains("GREEDY");
            Color textColor = isGreedy ? ACCENT_COLOR : PRIMARY_COLOR;

            addTableCell(table, strat + (isGreedy ? " (Proposed)" : ""), rowBg, Element.ALIGN_LEFT, isGreedy, textColor);
            addTableCell(table, num, rowBg, Element.ALIGN_RIGHT, false, null);
            addTableCell(table, String.format("%.1f", score), rowBg, Element.ALIGN_RIGHT, isGreedy, textColor);
            addTableCell(table, String.format("%.2f hrs", travel), rowBg, Element.ALIGN_RIGHT, false, null);

            count++;
        }

        doc.add(table);
    }

    private void addTableHeader(PdfPTable table, String[] headers) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, PRIMARY_COLOR);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBackgroundColor(HEADER_BG);
            cell.setBorderColor(BORDER_COLOR);
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String text, Color bg, int align, boolean bold, Color textColor) {
        Font font = FontFactory.getFont(
                bold ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA,
                8.0f,
                textColor != null ? textColor : PRIMARY_COLOR
        );
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(5);
        cell.setHorizontalAlignment(align);
        table.addCell(cell);
    }

    private void addFooter(Document doc) throws DocumentException {
        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7.5f, Color.GRAY);
        Paragraph p = new Paragraph("Disaster Resource Response Optimizer (DRRO) — Automated Decision Support Report. Confidential for Relief Operations.", footerFont);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingBefore(12);
        doc.add(p);
    }
}