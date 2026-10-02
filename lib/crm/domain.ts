import { z } from "zod";
import Papa from "papaparse";

export class CrmError extends Error { constructor(public code:string, public status=422, public details?:unknown){super(code);} }
const text=z.string().trim().min(1).max(500);
export const partySchema=z.object({name:text,address:z.string().trim().min(5).max(1000),legalId:text,vatId:z.string().trim().max(100).default("")});
export const lineSchema=z.object({description:text,quantity:z.string().regex(/^\d{1,6}(\.\d{1,3})?$/),unitPrice:z.string().regex(/^\d{1,8}(\.\d{1,2})?$/),vatRate:z.string().regex(/^\d{1,2}(\.\d{1,2})?$|^100(\.00)?$/)});
export const invoiceSchema=z.object({contactId:z.string().uuid(),supplier:partySchema,customer:partySchema,lines:z.array(lineSchema).min(1).max(50),paymentDays:z.number().int().min(0).max(365),issueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,"Date invalide"),paymentInstructions:text});
export type InvoiceInput=z.infer<typeof invoiceSchema>;
export type Party=z.infer<typeof partySchema>;
const fixed=(value:string,scale:number)=>{const [a,b=""]=value.split(".");return BigInt(a)*10n**BigInt(scale)+BigInt(b.padEnd(scale,"0"));};
const rounded=(a:bigint,b:bigint)=>(a+b/2n)/b;
export function calculateInvoice(lines:z.infer<typeof lineSchema>[]){
  let subtotal=0n,tax=0n;
  const calculated=lines.map(raw=>{const l=lineSchema.parse(raw),q=fixed(l.quantity,3);if(q<=0n)throw new CrmError("QUANTITY_MUST_BE_POSITIVE");const net=rounded(q*fixed(l.unitPrice,2),1000n),vat=rounded(net*fixed(l.vatRate,2),10000n);subtotal+=net;tax+=vat;return {...l,netCents:net.toString(),vatCents:vat.toString(),totalCents:(net+vat).toString()};});
  return {lines:calculated,subtotalCents:subtotal.toString(),taxCents:tax.toString(),totalCents:(subtotal+tax).toString(),currency:"EUR"};
}
export function euro(cents:string){const n=BigInt(cents);return `${n/100n},${String(n%100n).padStart(2,"0")} EUR`;}
export function dueDate(issue:string,days:number){const d=new Date(`${issue}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export const csvFields=["firstName","lastName","company","email","phone","status","notes"] as const;
export const importSchema=z.object({csv:z.string().min(1).max(2_000_000),mapping:z.record(z.string(),z.string()),filename:z.string().max(200).default("import.csv")});
export function parseCsv(csv:string){const parsed=Papa.parse<string[]>(csv.replace(/^\uFEFF/,""),{skipEmptyLines:"greedy"});if(parsed.errors.length)throw new CrmError("CSV_INVALID",422,parsed.errors);const [headers,...rows]=parsed.data;if(!headers?.length||new Set(headers).size!==headers.length)throw new CrmError("CSV_HEADERS_INVALID");if(rows.length>2000)throw new CrmError("CSV_TOO_MANY_ROWS");return {headers,rows};}

export function sameInvoiceInput(a:unknown,b:unknown){const left=invoiceSchema.safeParse(a),right=invoiceSchema.safeParse(b);return left.success&&right.success&&JSON.stringify(left.data)===JSON.stringify(right.data);}
