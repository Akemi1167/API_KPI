import * as ExcelJS from 'exceljs';
import { KpiPeriodDocument } from '../../kpi/schemas/kpi-period.schema';
import { UserDocument } from '../../users/schemas/user.schema';
import { KpiResultDocument } from '../../kpi/schemas/kpi-result.schema';

export interface BuildKpiResultsExcelInput {
  period: KpiPeriodDocument;
  employees: UserDocument[];
  resultsByUserId: Map<string, KpiResultDocument>;
  exportedAt: Date;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F4E78' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const META_LABEL_FONT: Partial<ExcelJS.Font> = { bold: true };

function formatDate(value: Date) {
  return value.toLocaleDateString('vi-VN');
}

function formatDateTime(value: Date) {
  return value.toLocaleString('vi-VN');
}

function yesNo(value: boolean | undefined) {
  if (value === undefined) {
    return '';
  }
  return value ? 'Có' : 'Không';
}

function buildFilename(periodCode: string, exportedAt: Date) {
  const stamp = exportedAt
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');
  const safeCode = periodCode.replace(/[^\w.-]+/g, '_');
  return `bao-cao-kpi_${safeCode}_${stamp}.xlsx`;
}

export async function buildKpiResultsExcelBuffer(
  input: BuildKpiResultsExcelInput,
): Promise<{ buffer: Buffer; filename: string }> {
  const { period, employees, resultsByUserId, exportedAt } = input;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'API_KPI';
  workbook.created = exportedAt;

  const sheet = workbook.addWorksheet('Bao cao KPI', {
    views: [{ state: 'frozen', ySplit: 8 }],
  });

  sheet.mergeCells('A1:N1');
  sheet.getCell('A1').value = 'BÁO CÁO KPI TOÀN BỘ NHÂN VIÊN';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  const metaRows: Array<[string, string]> = [
    ['Kỳ KPI', `${period.code} - ${period.name}`],
    ['Tháng/Năm', `${period.month}/${period.year}`],
    [
      'Thời gian',
      `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
    ],
    ['Trạng thái kỳ', period.status],
    ['Điểm gốc kỳ', String(period.baseScore)],
    ['Xuất lúc', formatDateTime(exportedAt)],
    ['Tổng nhân viên', String(employees.length)],
  ];

  metaRows.forEach(([label, value], index) => {
    const rowNumber = index + 2;
    sheet.getCell(`A${rowNumber}`).value = label;
    sheet.getCell(`A${rowNumber}`).font = META_LABEL_FONT;
    sheet.mergeCells(`B${rowNumber}:N${rowNumber}`);
    sheet.getCell(`B${rowNumber}`).value = value;
  });

  const headerRowNumber = 9;
  const headers = [
    'STT',
    'Mã NV',
    'Họ tên',
    'Email',
    'Phòng ban',
    'Chức vụ',
    'Điểm gốc',
    'Điểm cộng',
    'Điểm trừ',
    'Điểm cuối',
    'Xếp loại',
    '% Thưởng',
    'Đã duyệt',
    'Đã khóa',
  ];

  const headerRow = sheet.getRow(headerRowNumber);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 24;

  const sortedEmployees = [...employees].sort((a, b) =>
    a.employeeCode.localeCompare(b.employeeCode, 'vi'),
  );

  sortedEmployees.forEach((employee, index) => {
    const result = resultsByUserId.get(employee._id.toString());
    const row = sheet.getRow(headerRowNumber + 1 + index);

    const values: Array<string | number> = [
      index + 1,
      employee.employeeCode,
      employee.fullName,
      employee.email,
      employee.departmentName,
      employee.positionName ?? '',
      result?.baseScore ?? '',
      result?.bonusPoints ?? '',
      result?.penaltyPoints ?? '',
      result?.finalScore ?? '',
      result?.rating ?? 'Chưa tính KPI',
      result ? `${result.rewardPercent}%` : '',
      yesNo(result?.isApproved),
      yesNo(result?.isLocked),
    ];

    values.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      if ([7, 8, 9, 10, 12].includes(colIndex + 1)) {
        cell.alignment = { horizontal: 'center' };
      }
    });
  });

  sheet.columns = [
    { width: 6 },
    { width: 14 },
    { width: 24 },
    { width: 28 },
    { width: 24 },
    { width: 20 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
  ];

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    filename: buildFilename(period.code, exportedAt),
  };
}
