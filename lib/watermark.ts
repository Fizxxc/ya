/** VEIL experimental blind block-DCT watermark. This is not encryption or authentication.
 * Robustness is limited by cropping, lighting, camera focus and resampling.
 * 512px fixed canvas, 8x8 DCT blocks, repeated 32-bit ID + 8-bit CRC.
 */
export const SIDE=512, BLOCK=8, GRID=64, BITS=40;
const A=Array.from({length:8},(_,u)=>Array.from({length:8},(_,x)=>Math.cos((2*x+1)*u*Math.PI/16)));
const alpha=(u:number)=>u===0?1/Math.sqrt(2):1;
const coeff=(data:Uint8ClampedArray,x0:number,y0:number,u:number,v:number)=>{
 let sum=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++){const i=((y0+y)*SIDE+x0+x)*4;const Y=.299*data[i]+.587*data[i+1]+.114*data[i+2];sum+=(Y-128)*A[u][x]*A[v][y];}
 return .25*alpha(u)*alpha(v)*sum;
};
// Coefficients have the same frequency order; changing their difference is fairly subtle.
const U=2,V=3, U2=3,V2=2;
const cells=Array.from({length:GRID*GRID},(_,i)=>i);
function shuffled(seed:number){const arr=cells.slice();let x=seed>>>0;for(let i=arr.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
const order=shuffled(0x5645494c);
function crc8(bytes:Uint8Array){let c=0;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c&128)?((c<<1)^7)&255:(c<<1)&255;}return c;}
function bytesFor(hex:string){if(!/^[0-9a-f]{8}$/i.test(hex))throw new Error('ID harus 8 digit hex');return Uint8Array.from(hex.match(/../g)!.map(x=>parseInt(x,16)));}
function payload(hex:string){const bytes=bytesFor(hex);const full=[...bytes,crc8(bytes)];return full.flatMap(b=>Array.from({length:8},(_,k)=>(b>>(7-k))&1));}
function fromBits(bits:number[]){const bytes=Uint8Array.from(Array.from({length:5},(_,i)=>bits.slice(i*8,i*8+8).reduce((v,b)=>(v<<1)|b,0)));if(crc8(bytes.slice(0,4))!==bytes[4])return null;return Array.from(bytes.slice(0,4)).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
export function imageCanvas(source:CanvasImageSource){const c=document.createElement('canvas');c.width=SIDE;c.height=SIDE;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.fillStyle='#fff';ctx.fillRect(0,0,SIDE,SIDE);const s=source as HTMLImageElement;const w=(s.videoWidth||s.naturalWidth||('width' in s?s.width:512)) as number;const h=(s.videoHeight||s.naturalHeight||('height' in s?s.height:512)) as number;const scale=Math.min(SIDE/w,SIDE/h);ctx.drawImage(source,(SIDE-w*scale)/2,(SIDE-h*scale)/2,w*scale,h*scale);return c;}
export function embed(source:CanvasImageSource,id:string,strength=22){const c=imageCanvas(source),ctx=c.getContext('2d',{willReadFrequently:true})!,img=ctx.getImageData(0,0,SIDE,SIDE),d=img.data;const bits=payload(id);
 // A pixel-space realization of the two orthogonal DCT basis patterns.
 for(let n=0;n<order.length;n++){const cell=order[n],bx=(cell%GRID)*8,by=Math.floor(cell/GRID)*8,bit=bits[n%BITS];const c1=coeff(d,bx,by,U,V),c2=coeff(d,bx,by,U2,V2);const desired=(bit?1:-1)*strength;const delta=(desired-(c1-c2))/2;
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const basis=.25*(A[U][x]*A[V][y]-A[U2][x]*A[V2][y]);const off=((by+y)*SIDE+bx+x)*4;const change=delta*basis;for(let channel=0;channel<3;channel++)d[off+channel]=Math.max(0,Math.min(255,d[off+channel]+change));}
 }
 ctx.putImageData(img,0,0);return c;
}
export type DecodeResult={id:string|null;confidence:number;valid:boolean;agreement:number};
export function decode(source:CanvasImageSource):DecodeResult{const c=imageCanvas(source),d=c.getContext('2d',{willReadFrequently:true})!.getImageData(0,0,SIDE,SIDE).data;const votes=Array(BITS).fill(0),count=Array(BITS).fill(0);for(let n=0;n<order.length;n++){const cell=order[n],bx=(cell%GRID)*8,by=Math.floor(cell/GRID)*8;const diff=coeff(d,bx,by,U,V)-coeff(d,bx,by,U2,V2);const k=n%BITS;votes[k]+=Math.max(-60,Math.min(60,diff));count[k]++;}const bits=votes.map(v=>v>0?1:0);const id=fromBits(bits);const agreement=votes.reduce((sum,v,i)=>sum+Math.min(1,Math.abs(v)/Math.max(1,count[i]*12)),0)/BITS;return {id,valid:!!id,confidence:Math.round(agreement*100),agreement};}
export function randomId(){const bytes=new Uint8Array(4);crypto.getRandomValues(bytes);return Array.from(bytes).map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();}
