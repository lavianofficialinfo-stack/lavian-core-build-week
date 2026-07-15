import { NextResponse } from "next/server";

type ProductSale={id:string;sku:string;name:string;price:number;stock:number;threshold:number;qty:number;remaining:number;status:string};
type Payload={booking:{customer:string;service:string;stylist:string;date:string;time:string};workflow?:{duration?:number;approval?:boolean;source?:string;suggestion?:string};visit:{arrival:string;serviceNotes:string;option:string};checkout:{serviceFee:number;optionFee:number;productTotal:number;discount:number;tax:number;total:number;payment:string};products:ProductSale[];history:{nextVisit:string;completedAt:string}};

const b64=(data:string)=>Buffer.from(data).toString("base64url");
async function accessToken(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL; const pem=process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,"\n");
  if(!email||!pem)throw new Error("Google service account is not configured");
  const now=Math.floor(Date.now()/1000); const header=b64(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const claim=b64(JSON.stringify({iss:email,scope:"https://www.googleapis.com/auth/spreadsheets",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
  const key=await crypto.subtle.importKey("pkcs8",Buffer.from(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,""),"base64"),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(`${header}.${claim}`));
  const jwt=`${header}.${claim}.${Buffer.from(signature).toString("base64url")}`;
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})});
  if(!response.ok)throw new Error(`Google auth failed: ${response.status}`); return (await response.json() as {access_token:string}).access_token;
}
async function sheets(token:string,path:string,init?:RequestInit){const id=process.env.GOOGLE_SHEETS_ID;if(!id)throw new Error("GOOGLE_SHEETS_ID is missing");const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`,{...init,headers:{authorization:`Bearer ${token}`,"content-type":"application/json",...(init?.headers||{})}});if(!r.ok)throw new Error(`Sheets API ${r.status}: ${await r.text()}`);return r.json();}
const append=(token:string,tab:string,values:unknown[][])=>sheets(token,`/values/${encodeURIComponent(tab)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values})});

export async function POST(request:Request){
  const p=await request.json() as Payload; const finished=p.history.completedAt||new Date().toISOString();
  const slug=p.booking.customer.toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"")||"GUEST";
  const customerId=`CUS-${slug}`; const stamp=Date.now(); const bookingId=`BK-${stamp}`; const visitId=`VIS-${stamp}`; const saleId=`SALE-${stamp}`;
  if(!process.env.GOOGLE_SHEETS_ID||!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL||!process.env.GOOGLE_PRIVATE_KEY)return NextResponse.json({synced:false,mode:"demo",message:"Google Sheets is not configured"});
  try{
    const token=await accessToken();
    const current=await sheets(token,`/values/${encodeURIComponent("顧客台帳")}!A2:I1000` ) as {values?:unknown[][]};
    const rows=current.values||[]; const customerIndex=rows.findIndex(row=>row[0]===customerId); const previous=customerIndex>=0?rows[customerIndex]:[];
    const visits=Number(previous[5]||0)+1; const spend=Number(previous[6]||0)+p.checkout.total;
    const customerRow=[customerId,p.booking.customer,"demo@example.com",previous[3]||p.booking.date,p.booking.date,visits,spend,p.visit.serviceNotes,finished];
    if(customerIndex>=0)await sheets(token,`/values/${encodeURIComponent("顧客台帳")}!A${customerIndex+2}:I${customerIndex+2}?valueInputOption=USER_ENTERED`,{method:"PUT",body:JSON.stringify({values:[customerRow]})});else await append(token,"顧客台帳",[customerRow]);
    await Promise.all([
      append(token,"予約管理",[[bookingId,customerId,p.booking.customer,`${p.booking.date} ${p.booking.time}`,finished,p.booking.service,p.booking.stylist,"Completed",JSON.stringify(p.workflow||{}),p.workflow?.approval?"Approved":"Not required",finished]]),
      append(token,"来店施術履歴",[[visitId,bookingId,customerId,p.booking.date,p.visit.arrival||p.booking.time,"Completed",p.booking.service,p.booking.stylist,p.workflow?.suggestion||"",p.visit.option,p.visit.serviceNotes,p.history.nextVisit,finished]]),
      append(token,"会計売上",[[saleId,bookingId,customerId,p.checkout.serviceFee,p.checkout.optionFee,p.checkout.productTotal,p.checkout.discount,p.checkout.tax,p.checkout.total,p.checkout.payment,finished]]),
    ]);
    for(const product of p.products){await append(token,"在庫管理",[[`INV-${stamp}-${product.id}`,saleId,product.id,product.name,product.stock,product.qty,product.remaining,finished,product.remaining===0?"OUT OF STOCK":"",product.remaining<=product.threshold?"REORDER":""]]);}
    return NextResponse.json({synced:true,mode:"live",spreadsheetId:process.env.GOOGLE_SHEETS_ID,records:{customer:customerId,booking:bookingId,visit:visitId,sale:saleId,products:p.products.length}});
  }catch(error){console.error("Google Sheets sync failed",error);return NextResponse.json({synced:false,mode:"error",message:"Google Sheets sync failed"},{status:502});}
}
