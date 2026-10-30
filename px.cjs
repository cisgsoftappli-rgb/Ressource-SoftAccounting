const fs=require('fs'),z=require('zlib');
const b=fs.readFileSync(process.argv[2]);let p=8,w,h,idat=[];
while(p<b.length){const l=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8);if(t==='IHDR'){w=b.readUInt32BE(p+8);h=b.readUInt32BE(p+12);console.log('ct',b[p+17],'bd',b[p+16])}if(t==='IDAT')idat.push(b.slice(p+8,p+8+l));p+=12+l}
const raw=z.inflateSync(Buffer.concat(idat)),bpp=4,st=w*bpp;let prev=Buffer.alloc(st),rows=[];
for(let y=0;y<h;y++){const f=raw[y*(st+1)],r=Buffer.from(raw.slice(y*(st+1)+1,(y+1)*(st+1)));
for(let i=0;i<st;i++){const a=i>=bpp?r[i-bpp]:0,u=prev[i],c=i>=bpp?prev[i-bpp]:0;let v=r[i];
if(f===1)v+=a;else if(f===2)v+=u;else if(f===3)v+=(a+u)>>1;else if(f===4){const pa=Math.abs(u-c),pb=Math.abs(a-c),pc=Math.abs(a+u-2*c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?u:c)}r[i]=v&255}rows.push(r);prev=r}
for(let y=0;y<h;y++){let s='';for(let x=0;x<w;x++){const o=x*bpp;s+=String(Math.round((rows[y][o]+rows[y][o+1]+rows[y][o+2])/3)).padStart(4)}console.log(s)}
