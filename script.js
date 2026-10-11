const toolMeta = {
  paycheck:{title:"Paycheck Estimator",category:"WORK & PAY",disclaimer:"A rough estimate only. This uses the tax rate you enter; it does not calculate actual tax liability, deductions, benefits, or withholding rules.",fields:[["gross","Gross pay per paycheck ($)","number", "2000"],["rate","Estimated deductions / tax (%)","number","20"],["period","Pay frequency","select",[["weekly","Weekly"],["biweekly","Every 2 weeks"],["semimonthly","Twice a month"],["monthly","Monthly"]]]]},
  salary:{title:"Hourly to Salary",category:"WORK & PAY",disclaimer:"Gross pay before taxes, unpaid time off, benefits, or other deductions.",fields:[["wage","Hourly wage ($)","number","22"],["hours","Hours per week","number","40"],["weeks","Paid weeks per year","number","52"]]},
  timecard:{title:"Time Card Calculator",category:"WORK & PAY",disclaimer:"This is a basic estimate of gross pay and does not determine overtime eligibility or applicable labor-law requirements.",fields:[["hours","Total hours worked","number","40"],["rate","Hourly wage ($)","number","20"],["overtime","Overtime hours included above","number","0"],["otmult","Overtime multiplier","number","1.5"]]},
  loan:{title:"Loan Payment Calculator",category:"MONEY",disclaimer:"Estimate only. Actual payments can include fees, insurance, variable rates, and lender-specific terms.",fields:[["principal","Loan amount ($)","number","15000"],["apr","Annual interest rate (%)","number","7"],["term","Loan term (years)","number","5"]]},
  tax:{title:"Sales Tax Calculator",category:"SHOPPING",disclaimer:"Enter the applicable combined tax rate for your purchase location. Taxability and rounding rules vary.",fields:[["price","Price before tax ($)","number","50"],["rate","Sales tax rate (%)","number","8.25"]]},
  discount:{title:"Discount Calculator",category:"SHOPPING",disclaimer:"Does not include sales tax, shipping, or store-specific terms.",fields:[["price","Original price ($)","number","80"],["rate","Discount (%)","number","25"]]},
  tip:{title:"Tip & Split Bill",category:"EVERYDAY",disclaimer:"A simple bill-splitting estimate. Adjust the tip percentage and number of people to suit your situation.",fields:[["bill","Bill amount ($)","number","60"],["rate","Tip (%)","number","18"],["people","Number of people","number","2"]]},
  percentage:{title:"Percentage Calculator",category:"EVERYDAY",disclaimer:"This calculates a percentage of a value.",fields:[["rate","What percentage? (%)","number","15"],["value","Of what number?","number","200"]]},
  grade:{title:"Grade Calculator",category:"EVERYDAY",disclaimer:"This calculates points earned divided by total possible points. Course weighting and grading policies may differ.",fields:[["earned","Points earned","number","42"],["total","Total possible points","number","50"]]},
  age:{title:"Age Calculator",category:"EVERYDAY",disclaimer:"Calculated using calendar dates on this device.",fields:[["birth","Date of birth","date","2000-01-01"],["asof","Calculate age on","date",new Date().toISOString().slice(0,10)]]}
};
const $ = s => document.querySelector(s);
const dialog = $("#calcDialog");
let activeTool = null;
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number.isFinite(n)?n:0)}
function num(id){return Number($("#f_"+id).value)}
function addField(f){const [id,label,type,defaultVal]=f;let wrap=document.createElement("div");wrap.className="field";if(id==="gross"||id==="principal")wrap.classList.add("full");let lab=document.createElement("label");lab.htmlFor="f_"+id;lab.textContent=label;wrap.appendChild(lab);let input;
 if(type==="select"){input=document.createElement("select");defaultVal.forEach(([v,t])=>{let o=document.createElement("option");o.value=v;o.textContent=t;input.appendChild(o)})}
 else{input=document.createElement("input");input.type=type;input.step=type==="number"?"any":undefined;if(type==="number")input.min="0"}
 input.id="f_"+id;input.name=id;if(type==="select")input.value=defaultVal[0][0];else input.value=defaultVal;wrap.appendChild(input);return wrap}
function openCalc(key){activeTool=key;const meta=toolMeta[key];$("#dialogTitle").textContent=meta.title;$("#dialogCategory").textContent=meta.category;$("#calcDisclaimer").textContent=meta.disclaimer;$("#calcFields").replaceChildren(...meta.fields.map(addField));$("#calcResult").hidden=true;dialog.showModal()}
document.querySelectorAll(".tool-card").forEach(card=>card.addEventListener("click",()=>openCalc(card.dataset.tool)));
$("#closeDialog").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
function result(main, lines=[]){$("#calcResult").innerHTML=`<div class="result-label">YOUR ESTIMATE</div><div class="result-main">${main}</div><div class="result-breakdown">${lines.map(([k,v])=>`<div class="result-line"><span>${k}</span><strong>${v}</strong></div>`).join("")}</div>`;$("#calcResult").hidden=false}
$("#calcForm").addEventListener("submit",e=>{e.preventDefault();let r,lines=[];
 try{
 switch(activeTool){
 case "paycheck":{let gross=num("gross"),rate=num("rate"),factor=$("#f_period").value;let net=gross*(1-rate/100);let count={weekly:52,biweekly:26,semimonthly:24,monthly:12}[factor];r=money(net);lines=[["Estimated deductions",money(gross-net)],["Gross annualized",money(gross*count)],["Net annualized",money(net*count)]];break}
 case "salary":{let wage=num("wage"),hours=num("hours"),weeks=num("weeks");r=money(wage*hours*weeks);lines=[["Weekly",money(wage*hours)],["Monthly average",money(wage*hours*weeks/12)],["Hourly rate",money(wage)]];break}
 case "timecard":{let h=num("hours"),rate=num("rate"),ot=Math.min(h,num("overtime")),mult=num("otmult");let gross=(h-ot)*rate+ot*rate*mult;r=money(gross);lines=[["Regular hours",`${(h-ot).toFixed(2)} hrs`],["Overtime hours",`${ot.toFixed(2)} hrs`],["Estimated gross pay",money(gross)]];break}
 case "loan":{let p=num("principal"),monthly=num("apr")/1200,n=num("term")*12;let pay=monthly===0?p/n:p*monthly/(1-Math.pow(1+monthly,-n));r=money(pay)+"/mo";lines=[["Number of payments",String(n)],["Total paid",money(pay*n)],["Total interest",money(pay*n-p)]];break}
 case "tax":{let p=num("price"),tax=p*num("rate")/100;r=money(p+tax);lines=[["Price before tax",money(p)],["Estimated sales tax",money(tax)]];break}
 case "discount":{let p=num("price"),save=p*num("rate")/100;r=money(p-save);lines=[["You save",money(save)],["Original price",money(p)],["Discount",`${num("rate").toFixed(2)}%`]];break}
 case "tip":{let bill=num("bill"),tip=bill*num("rate")/100,total=bill+tip,people=Math.max(1,Math.floor(num("people")));r=money(total/people)+" per person";lines=[["Tip amount",money(tip)],["Total with tip",money(total)],["People splitting",String(people)]];break}
 case "percentage":{let v=num("value"),pct=num("rate");r=money(v*pct/100);lines=[[`${pct}% of ${v}`,money(v*pct/100)],["Original value",v.toLocaleString("en-US")]];break}
 case "grade":{let e=num("earned"),t=num("total");if(t<=0)throw new Error("Total possible points must be greater than zero.");let pct=e/t*100;r=pct.toFixed(2)+"%";lines=[["Points earned",e.toLocaleString("en-US")],["Points possible",t.toLocaleString("en-US")]];break}
 case "age":{let b=new Date($("#f_birth").value+"T12:00:00"),a=new Date($("#f_asof").value+"T12:00:00");if(Number.isNaN(b.getTime())||Number.isNaN(a.getTime())||b>a)throw new Error("Please enter valid dates, with the calculation date on or after the birth date.");let y=a.getFullYear()-b.getFullYear(),m=a.getMonth()-b.getMonth(),d=a.getDate()-b.getDate();if(d<0){m--;d+=new Date(a.getFullYear(),a.getMonth(),0).getDate()}if(m<0){y--;m+=12}r=`${y} years`;lines=[["Months",String(m)],["Days",String(d)],["Total months (approx.)",String(y*12+m)]];break}
 }
 result(r,lines);
 }catch(err){$("#calcResult").hidden=false;$("#calcResult").innerHTML=`<div class="result-label">CHECK YOUR INPUT</div><div style="font-size:13px;margin-top:7px">${err.message}</div>`}
});
const search=$("#toolSearch");let category="all";
function filterTools(){let q=search.value.toLowerCase().trim(),shown=0;document.querySelectorAll(".tool-card").forEach(card=>{let matchCat=category==="all"||card.dataset.category===category;let matchText=(card.innerText+" "+card.dataset.keywords).toLowerCase().includes(q);let visible=matchCat&&matchText;card.hidden=!visible;if(visible)shown++});$("#noResults").hidden=shown!==0}
search.addEventListener("input",filterTools);document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{category=tab.dataset.category;document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===tab));filterTools()}));
$("#year").textContent=new Date().getFullYear();
