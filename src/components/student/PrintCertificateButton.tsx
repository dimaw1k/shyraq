"use client";

export function PrintCertificateButton(){
  return <button type="button" onClick={()=>window.print()} className="rounded-[12px] bg-[#FF6F2C] px-4 py-3 text-[10px] font-extrabold text-white">Сертификат</button>;
}
