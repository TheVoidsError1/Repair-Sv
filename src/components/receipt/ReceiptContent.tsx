/**
 * View: ใบเสร็จรับเงิน (RECEIPT)
 * อ้างอิงรูปแบบและข้อมูลจากใบเสร็จรับเงินต้นแบบ 100%
 * เหมาะกับการพิมพ์ A4
 * โหมดแก้ไข: รูปแบบเดิม แต่คลิกที่ส่วนใดก็แก้ไขได้แบบ Word (contenteditable)
 */
import type { ReceiptData, ReceiptLineItem } from "@/lib/receipt";
import { formatReceiptNumber } from "@/lib/receipt";
import { useCallback, useEffect, useRef } from "react";

export interface ReceiptContentProps {
  data: ReceiptData;
  /** โหมดแก้ไข: คลิกเลือกที่ส่วนใดก็แก้ไขได้เหมือน Word */
  editable?: boolean;
  /** callback เมื่อมีการแก้ไข (ใช้เมื่อ editable=true) */
  onChange?: (updates: Partial<ReceiptData>) => void;
}

function parseNum(value: string): number {
  const n = parseFloat(String(value).replace(/,/g, "").trim());
  return Number.isNaN(n) ? 0 : n;
}

/** ช่องที่คลิกแล้วแก้ไขได้ แบบ Word — ดูเหมือนข้อความธรรมดา */
function EditableSpan({
  value,
  className,
  editable,
  onBlur,
}: {
  value: string;
  className?: string;
  editable?: boolean;
  onBlur: (text: string) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const handleBlur = useCallback(() => {
    const text = ref.current?.innerText?.trim() ?? "";
    onBlur(text);
  }, [onBlur]);
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  }, []);
  useEffect(() => {
    if (editable && ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = value ?? "";
    }
  }, [editable, value]);
  if (!editable) {
    return <span className={className}>{value || "\u00A0"}</span>;
  }
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`${className ?? ""} receipt-editable min-h-[1.2em] outline-none focus:ring-1 focus:ring-inset focus:ring-gray-300 rounded cursor-text`}
      onBlur={handleBlur}
      onPaste={handlePaste}
    />
  );
}

/** ช่องตัวเลขในตาราง — คลิกแก้ไข แล้ว parse เป็น number ตอน blur */
function EditableNumber({
  value,
  format,
  className,
  editable,
  onBlur,
  align = "left",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  editable?: boolean;
  onBlur: (num: number) => void;
  align?: "left" | "right" | "center";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const handleBlur = useCallback(() => {
    const raw = ref.current?.innerText?.replace(/,/g, "").trim() ?? "";
    const num = parseNum(raw);
    onBlur(num);
  }, [onBlur]);
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  }, []);
  const display = value === 0 ? "" : format(value);
  useEffect(() => {
    if (editable && ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = display;
    }
  }, [editable, display]);
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "";
  if (!editable) {
    return <span className={`${className ?? ""} ${alignClass}`}>{format(value)}</span>;
  }
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`${className ?? ""} ${alignClass} receipt-editable min-w-[2ch] outline-none focus:ring-1 focus:ring-inset focus:ring-gray-300 rounded cursor-text`}
      onBlur={handleBlur}
      onPaste={handlePaste}
    />
  );
}

/** จำนวนแถวว่างในตารางรายการ (ให้พอเขียนเพิ่ม) */
const EMPTY_TABLE_ROWS = 7;

export function ReceiptContent({ data, editable, onChange }: ReceiptContentProps) {
  const {
    shop,
    receiptNo,
    issueDate,
    customerName,
    customerId,
    customerAddress,
    purchaseOrderNo,
    deliverOrderNo,
    salesmanCode,
    items,
    subtotal,
    grandTotal,
    copyLabel,
  } = data;

  const displayNo = receiptNo !== "—" && !receiptNo.startsWith("No") ? `No${receiptNo}` : receiptNo;

  const updateItem = (index: number, patch: Partial<ReceiptLineItem>) => {
    if (!onChange) return;
    const next = items.map((row, i): ReceiptLineItem => {
      if (i !== index) return row;
      const merged = { ...row, ...patch };
      if (patch.quantity !== undefined || patch.unitPrice !== undefined) {
        const q = patch.quantity ?? merged.quantity;
        const u = patch.unitPrice ?? merged.unitPrice;
        merged.amount = (typeof q === "number" ? q : 1) * (typeof u === "number" ? u : 0);
      }
      return merged;
    });
    const newSubtotal = next.reduce((sum, i) => sum + i.amount, 0);
    onChange({ items: next, subtotal: newSubtotal, grandTotal: newSubtotal });
  };

  return (
    <div className="receipt-document bg-white text-gray-900 p-6 max-w-[210mm] mx-auto shadow-sm print:shadow-none print:p-4 text-sm">
      {/* 1) ส่วนหัวเอกสาร - ตามต้นแบบ */}
      <div className="flex justify-between items-start gap-4 mb-4">
        {/* ซ้าย: ชื่อร้าน ที่อยู่ โทร (ตัวเล็ก) */}
        <div className="text-[11px] text-gray-800 leading-tight">
          <p className="font-semibold">{shop.name}</p>
          <p>{shop.address}</p>
          <p>{shop.phone}</p>
        </div>
        {/* ขวา: โลโก้ + เลขที่ + วันที่ */}
        <div className="text-right shrink-0">
          <p className="text-base font-bold tracking-tight">
            MacFix <span className="font-normal text-sm">service</span>
          </p>
          <div className="mt-1.5 text-[11px] space-y-0.5">
            <p>เลขที่ {displayNo}</p>
            <p>วันที่ {issueDate}</p>
          </div>
        </div>
      </div>
      {/* ชื่อเอกสารกึ่งกลาง */}
      <div className="text-center border-y border-gray-800 py-2 my-3">
        <p className="text-xl font-bold">ใบเสร็จรับเงิน</p>
        <p className="text-xs text-gray-600 -mt-0.5">RECEIPT</p>
      </div>

      {/* 2) ข้อมูลลูกค้า - ตามต้นแบบ */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-[10px] text-gray-600">ชื่อลูกค้า</p>
            {editable && onChange ? (
              <p className="font-medium mt-0.5">
                <EditableSpan
                  value={customerName}
                  editable
                  onBlur={(v) => onChange({ customerName: v })}
                />
              </p>
            ) : (
              <p className="font-medium">{customerName}</p>
            )}
          </div>
          {customerId ? (
            <div>
              <p className="text-[10px] text-gray-600">เลขประจำตัว</p>
              <p className="font-medium">{customerId}</p>
            </div>
          ) : null}
        </div>
        {customerAddress ? (
          <div>
            <p className="text-[10px] text-gray-600">ที่อยู่</p>
            <p className="font-medium">{customerAddress}</p>
          </div>
        ) : null}
      </div>
      {/* แถว 3 ช่อง: ใบสั่งซื้อเลขที่ | ใบส่งของ/ใบแจ้งหนี้ | พนักงานขาย */}
      <div className="grid grid-cols-3 border border-gray-700 mb-4">
        <div className="border-r border-gray-700 p-2">
          <p className="text-[10px] text-gray-600">ใบสั่งซื้อเลขที่</p>
          <p className="text-[10px] text-gray-500">PURCHASE ORDER NO.</p>
          {editable && onChange ? (
            <p className="min-h-[1.2em] text-xs mt-0.5">
              <EditableSpan
                value={purchaseOrderNo || ""}
                editable
                onBlur={(v) => onChange({ purchaseOrderNo: v })}
              />
            </p>
          ) : (
            <p className="min-h-[1.2em] text-xs">{purchaseOrderNo || ""}</p>
          )}
        </div>
        <div className="border-r border-gray-700 p-2">
          <p className="text-[10px] text-gray-600">ใบส่งของ/ใบแจ้งหนี้</p>
          <p className="text-[10px] text-gray-500">DELIVER ORDER NO.</p>
          {editable && onChange ? (
            <p className="min-h-[1.2em] text-xs mt-0.5">
              <EditableSpan
                value={deliverOrderNo || ""}
                editable
                onBlur={(v) => onChange({ deliverOrderNo: v })}
              />
            </p>
          ) : (
            <p className="min-h-[1.2em] text-xs">{deliverOrderNo || ""}</p>
          )}
        </div>
        <div className="p-2">
          <p className="text-[10px] text-gray-600">ชื่อพนักงาน / ช่องเซ็นชื่อพนักงาน</p>
          <p className="text-[10px] text-gray-500">STAFF NAME / SIGNATURE</p>
          {editable && onChange ? (
            <p className="min-h-[1.2em] text-xs font-medium mt-0.5">
              <EditableSpan
                value={salesmanCode || ""}
                editable
                onBlur={(v) => onChange({ salesmanCode: v })}
              />
            </p>
          ) : salesmanCode ? (
            <p className="min-h-[1.2em] text-xs font-medium">{salesmanCode}</p>
          ) : (
            <div className="min-h-[1.8em] border-b border-gray-500 mt-0.5" />
          )}
        </div>
      </div>

      {/* 3) ตารางรายการ - 5 คอลัมน์ ตามต้นแบบ */}
      <table className="w-full border-collapse border border-gray-700 text-[11px] mb-2">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-700">
            <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold w-[12%]">รหัสสินค้า</th>
            <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold">รายการ</th>
            <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold w-[8%]">จำนวน</th>
            <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold w-[14%]">ราคาต่อหน่วย</th>
            <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold w-[14%]">จำนวนเงิน</th>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-600">
            <th className="border border-gray-600 px-2 py-0.5 text-[10px] font-normal text-gray-600">ITEM CODE</th>
            <th className="border border-gray-600 px-2 py-0.5 text-[10px] font-normal text-gray-600">DESCRIPTION</th>
            <th className="border border-gray-600 px-2 py-0.5 text-[10px] font-normal text-gray-600">QUANTITY</th>
            <th className="border border-gray-600 px-2 py-0.5 text-[10px] font-normal text-gray-600">UNIT PRICE</th>
            <th className="border border-gray-600 px-2 py-0.5 text-[10px] font-normal text-gray-600">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={i} className="border-b border-gray-500">
              <td className="border border-gray-500 px-2 py-1.5">
                {editable && onChange ? (
                  <EditableSpan
                    value={row.itemCode || ""}
                    editable
                    onBlur={(v) => updateItem(i, { itemCode: v })}
                  />
                ) : (
                  row.itemCode || ""
                )}
              </td>
              <td className="border border-gray-500 px-2 py-1.5">
                {editable && onChange ? (
                  <EditableSpan
                    value={row.description}
                    editable
                    onBlur={(v) => updateItem(i, { description: v })}
                  />
                ) : (
                  row.description
                )}
              </td>
              <td className="border border-gray-500 px-2 py-1.5 text-center">
                {editable && onChange ? (
                  <EditableNumber
                    value={row.quantity}
                    format={(n) => String(n)}
                    editable
                    align="center"
                    onBlur={(v) => updateItem(i, { quantity: v >= 1 ? v : 1 })}
                  />
                ) : (
                  row.quantity
                )}
              </td>
              <td className="border border-gray-500 px-2 py-1.5 text-right">
                {editable && onChange ? (
                  <EditableNumber
                    value={row.unitPrice}
                    format={formatReceiptNumber}
                    editable
                    align="right"
                    onBlur={(v) => updateItem(i, { unitPrice: v })}
                  />
                ) : (
                  formatReceiptNumber(row.unitPrice)
                )}
              </td>
              <td className="border border-gray-500 px-2 py-1.5 text-right">
                {formatReceiptNumber(row.amount)}
              </td>
            </tr>
          ))}
          {Array.from({ length: EMPTY_TABLE_ROWS }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-gray-400">
              <td className="border border-gray-400 px-2 py-1.5">&nbsp;</td>
              <td className="border border-gray-400 px-2 py-1.5">&nbsp;</td>
              <td className="border border-gray-400 px-2 py-1.5">&nbsp;</td>
              <td className="border border-gray-400 px-2 py-1.5">&nbsp;</td>
              <td className="border border-gray-400 px-2 py-1.5">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4+5) ส่วนการรับเงิน + สรุปยอด + ลายเซ็น - ตามรูปตัวอย่าง 100% (ซ้าย: การรับเงิน/ผู้รับเงิน/วันที่, ขวา: สรุปยอด/ผู้รับบริการ) */}
      <div className="border-2 border-gray-800 rounded p-4 mb-2">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* ซ้าย: ได้รับเงินแล้ว + ช่องติ๊ก + ช่องกรอก + ผู้รับเงิน/วันที่ */}
          <div className="flex-1 min-w-0">
            <p className="font-bold mb-3">ได้รับเงินแล้ว</p>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-gray-700 rounded shrink-0" />
                <span>เงินสด CASH</span>
              </label>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="inline-block w-4 h-4 border-2 border-gray-700 rounded shrink-0 align-middle" />
                <span className="text-xs">เช็คธนาคาร CHEQUE BANK</span>
                <span className="text-[10px] text-gray-600">เลขที่</span>
                <span className="inline-block w-14 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">ลงวันที่</span>
                <span className="text-[10px] text-gray-500">DATE</span>
                <span className="inline-block w-14 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">ธนาคาร</span>
                <span className="inline-block w-16 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">สาขา</span>
                <span className="text-[10px] text-gray-500">BRANCH</span>
                <span className="inline-block w-14 border-b border-dashed border-gray-600" />
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="inline-block w-4 h-4 border-2 border-gray-700 rounded shrink-0 align-middle" />
                <span className="text-xs">โอนเงินเข้าบัญชี</span>
                <span className="text-[10px] text-gray-600">ธนาคาร</span>
                <span className="inline-block w-14 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">สาขา</span>
                <span className="inline-block w-14 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">ชื่อบัญชี</span>
                <span className="inline-block w-20 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">เลขที่บัญชี</span>
                <span className="inline-block w-20 border-b border-dashed border-gray-600" />
                <span className="text-[10px] text-gray-600">เลขที่ Pay-In slip</span>
                <span className="inline-block w-16 border-b border-dashed border-gray-600" />
              </div>
            </div>
            <div className="flex gap-6 border-t border-gray-600 pt-3">
              <div>
                <p className="text-[10px] text-gray-700">ผู้รับเงิน</p>
                <div className="w-28 h-6 border-b border-dashed border-gray-600 mt-0.5" />
                <p className="text-[10px] text-gray-500 mt-0.5">COLLECTOR</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-700">วันที่</p>
                <div className="w-24 h-6 border-b border-dashed border-gray-600 mt-0.5" />
                <p className="text-[10px] text-gray-500 mt-0.5">DATE</p>
              </div>
            </div>
          </div>
          {/* ขวา: สรุปยอด (รวมเงิน, จำนวนเงินทั้งสิ้น) + ผู้รับบริการ */}
          <div className="w-full sm:w-56 shrink-0 flex flex-col items-end">
            <table className="w-full max-w-[220px] border border-gray-700 text-[11px] mb-4">
              <tbody>
                <tr className="border-t-2 border-gray-800">
                  <td className="py-2 pl-2 pr-2 text-right font-semibold">จำนวนเงินทั้งสิ้น</td>
                  <td className="py-2 pr-2 text-right font-bold w-16 border-l border-gray-700">{formatReceiptNumber(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
            <div className="w-full max-w-[220px]">
              <p className="text-[10px] text-gray-700">ผู้รับบริการ</p>
              <div className="w-full h-8 border-b border-dashed border-gray-600 mt-0.5" />
              <p className="text-[10px] text-gray-500 mt-0.5">AUTHORISED SIGNATURE</p>
            </div>
          </div>
        </div>
      </div>

      {/* ท้ายเอกสาร: สำหรับลูกค้า (FOR CUSTOMER) */}
      {copyLabel ? (
        <p className="text-right text-[11px] text-gray-700 mt-2">({copyLabel})</p>
      ) : null}
    </div>
  );
}
