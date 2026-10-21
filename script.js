const toolMeta = {
  paycheck:{title:"Paycheck Estimator",category:"WORK & PAY",disclaimer:"A rough estimate only. This uses the tax rate you enter; it does not calculate actual tax liability, deductions, benefits, or withholding rules.",formula:"Net ≈ Gross × (1 − tax rate)",fields:[["gross","Gross pay per paycheck ($)","number", "2000"],["rate","Estimated deductions / tax (%)","number","20"],["period","Pay frequency","select",[["weekly","Weekly"],["biweekly","Every 2 weeks"],["semimonthly","Twice a month"],["monthly","Monthly"]]]]},
  salary:{title:"Hourly to Salary",category:"WORK & PAY",disclaimer:"Gross pay before taxes, unpaid time off, benefits, or other deductions.",formula:"Annual = hourly × hours/week × weeks/year",fields:[["wage","Hourly wage ($)","number","22"],["hours","Hours per week","number","40"],["weeks","Paid weeks per year","number","52"]]},
  timecard:{title:"Time Card Calculator",category:"WORK & PAY",disclaimer:"This is a basic estimate of gross pay and does not determine overtime eligibility or applicable labor-law requirements.",formula:"Gross = (regular hrs × rate) + (OT hrs × rate × multiplier)",fields:[["hours","Total hours worked","number","40"],["rate","Hourly wage ($)","number","20"],["overtime","Overtime hours included above","number","0"],["otmult","Overtime multiplier","number","1.5"]]},
  loan:{title:"Loan Payment Calculator",category:"MONEY",disclaimer:"Estimate only. Actual payments can include fees, insurance, variable rates, and lender-specific terms.",formula:"Payment = P × r(1+r)^n / ((1+r)^n − 1)",fields:[["principal","Loan amount ($)","number","15000"],["apr","Annual interest rate (%)","number","7"],["term","Loan term (years)","number","5"]]},
  tax:{title:"Sales Tax Calculator",category:"SHOPPING",disclaimer:"Enter the applicable combined tax rate for your purchase location. Taxability and rounding rules vary.",formula:"Total = price × (1 + tax rate)",fields:[["price","Price before tax ($)","number","50"],["rate","Sales tax rate (%)","number","8.25"]]},
  discount:{title:"Discount Calculator",category:"SHOPPING",disclaimer:"Does not include sales tax, shipping, or store-specific terms.",formula:"Sale price = original × (1 − discount %)",fields:[["price","Original price ($)","number","80"],["rate","Discount (%)","number","25"]]},
  tip:{title:"Tip & Split Bill",category:"EVERYDAY",disclaimer:"A simple bill-splitting estimate. Adjust the tip percentage and number of people to suit your situation.",formula:"Per person = (bill + tip) / people",fields:[["bill","Bill amount ($)","number","60"],["rate","Tip (%)","number","18"],["people","Number of people","number","2"]]},
  percent:{title:"Percentage Calculator",category:"EVERYDAY",disclaimer:"Basic percentage math. Results are rounded for readability.",formula:"Result = (part / whole) × 100 or value × rate",fields:[["mode","What to calculate","select",[["of","What is X% of Y"],["is","X is what % of Y"],["change","Percentage change"]]],["a","First number (X)","number","25"],["b","Second number (Y)","number","200"]]},
  grade:{title:"Final Grade Needed",category:"EVERYDAY",disclaimer:"Assumes a weighted average. Does not account for extra credit or curved grading.",formula:"Needed = (target − current×(1−weight)) / weight",fields:[["current","Current grade (%)","number","85"],["weight","Final exam weight (%)","number","20"],["target","Desired final grade (%)","number","90"]]},
  overtime:{title:"Overtime Pay",category:"WORK & PAY",disclaimer:"Simple OT estimate. Actual eligibility and rates depend on your local labor laws and employer policy.",formula:"OT pay = OT hours × rate × multiplier",fields:[["hours","Overtime hours","number","5"],["rate","Regular hourly rate ($)","number","20"],["mult","OT multiplier","number","1.5"]]},
  schedule:{title:"Work Schedule Hours",category:"WORK & PAY",disclaimer:"Adds up your weekly shifts. Breaks are treated as unpaid. Does not determine overtime eligibility.",formula:"Total hours = sum of (end − start − break)",custom:true},
  age:{title:"Age Calculator",category:"HEALTH",disclaimer:"Exact age in years, months, and days. Leap years are handled by the calendar.",formula:"Age = as-of date − birth date",fields:[["birth","Birth date","date","1990-01-15"],["asof","Calculate age as of","date",new Date().toISOString().slice(0,10)]]},
  bmi:{title:"BMI Calculator",category:"HEALTH",disclaimer:"BMI is a screening tool only and does not diagnose health conditions. Use metric or imperial units.",formula:"BMI = weight(kg) / height(m)²",fields:[["weight","Weight","number","70"],["wunit","Weight unit","select",[["kg","Kilograms (kg)"],["lb","Pounds (lb)"]]],["height","Height","number","170"],["hunit","Height unit","select",[["cm","Centimeters (cm)"],["in","Inches (in)"]]]]},
  datediff:{title:"Days Between Dates",category:"EVERYDAY",disclaimer:"Counts whole calendar days between the two dates. Inclusive option adds 1 day.",formula:"Difference = end date − start date",fields:[["start","Start date","date",new Date().toISOString().slice(0,10)],["end","End date","date",new Date(Date.now()+7*864e5).toISOString().slice(0,10)],["inclusive","Count inclusive?","select",[["no","No (elapsed days)"],["yes","Yes (include both days)"]]]]},
  mortgage:{title:"Mortgage Payment",category:"MONEY",disclaimer:"Estimate only for a fixed-rate loan. Does not include taxes, insurance, HOA, PMI, or fees.",formula:"Payment = P × r(1+r)^n / ((1+r)^n − 1)",fields:[["principal","Home loan amount ($)","number","350000"],["apr","Annual interest rate (%)","number","6.5"],["term","Loan term (years)","number","30"]]},
  compound:{title:"Compound Interest",category:"MONEY",disclaimer:"Simple compound growth estimate. Does not account for fees, taxes, or variable rates.",formula:"A = P(1 + r/n)^(n·t)",fields:[["principal","Starting amount ($)","number","10000"],["rate","Annual interest rate (%)","number","5"],["years","Years","number","10"],["freq","Compounding","select",[["12","Monthly"],["4","Quarterly"],["1","Annually"],["365","Daily"]]]]}
};

const $ = s => document.querySelector(s);
const dialog = $("#calcDialog");
let activeTool = null;
let liveBound = false;

function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number.isFinite(n)?n:0)}
function num(id){const el=$("#f_"+id); return el ? Number(el.value) : NaN}

function addField(f){
  const [id,label,type,defaultVal]=f;
  let wrap=document.createElement("div");
  wrap.className="field";
  if(id==="gross"||id==="principal"||id==="weight"||id==="height")wrap.classList.add("full");
  let lab=document.createElement("label");
  lab.htmlFor="f_"+id;
  lab.textContent=label;
  wrap.appendChild(lab);
  let input;
  if(type==="select"){
    input=document.createElement("select");
    defaultVal.forEach(([v,t])=>{let o=document.createElement("option");o.value=v;o.textContent=t;input.appendChild(o)});
  } else {
    input=document.createElement("input");
    input.type=type;
    input.step=type==="number"?"any":undefined;
    if(type==="number")input.min="0";
  }
  input.id="f_"+id;
  input.name=id;
  if(type==="select")input.value=defaultVal[0][0];
  else input.value=defaultVal;
  wrap.appendChild(input);
  return wrap;
}

function addScheduleFields(){
  const container=document.createElement("div");
  container.className="schedule-fields full";
  const intro=document.createElement("p");
  intro.className="schedule-intro";
  intro.textContent="Enter each day's start and end time. Leave both times blank for a day off. Breaks are unpaid minutes.";
  container.appendChild(intro);
  const header=document.createElement("div");
  header.className="schedule-row schedule-header";
  header.innerHTML="<span>Day</span><span>Start</span><span>End</span><span>Break (min)</span>";
  container.appendChild(header);
  const days=[["Monday","mon"],["Tuesday","tue"],["Wednesday","wed"],["Thursday","thu"],["Friday","fri"],["Saturday","sat"],["Sunday","sun"]];
  days.forEach(([label,key],i)=>{
    const row=document.createElement("div");
    row.className="schedule-row";
    const day=document.createElement("strong");
    day.textContent=label;
    row.appendChild(day);
    [["start","time",i<5?"09:00":""],["end","time",i<5?"17:00":""],["break","number",i<5?"30":"0"]].forEach(([part,type,value])=>{
      const input=document.createElement("input");
      input.type=type;
      input.id=`f_${key}_${part}`;
      input.setAttribute("aria-label",`${label} ${part}`);
      if(type==="number"){input.min="0";input.max="1440";input.step="1"}
      input.value=value;
      row.appendChild(input);
    });
    container.appendChild(row);
  });
  const wageWrap=document.createElement("div");
  wageWrap.className="field full";
  wageWrap.innerHTML='<label for="f_scheduleWage">Hourly wage (optional, $)</label><input type="number" id="f_scheduleWage" min="0" step="any" placeholder="Leave blank to skip pay estimate">';
  container.appendChild(wageWrap);
  return container;
}

function result(main, lines=[], formula=""){
  const formulaHtml = formula ? `<div class="result-formula"><span>Formula</span><code>${formula}</code></div>` : "";
  $("#calcResult").innerHTML=`<div class="result-label">YOUR ESTIMATE</div><div class="result-main">${main}</div>${formulaHtml}<div class="result-breakdown">${lines.map(([k,v])=>`<div class="result-line"><span>${k}</span><strong>${v}</strong></div>`).join("")}</div><div class="result-actions"><button type="button" class="copy-result" id="copyResult">Copy result</button></div>`;
  $("#calcResult").hidden=false;
  const btn=$("#copyResult");
  if(btn)btn.onclick=()=>{
    const title = toolMeta[activeTool]?.title || "Calculator";
    const text = title + "\n" + main + "\n" + lines.map(([k,v])=>`${k}: ${v}`).join("\n") + "\nhttps://evrydaycalc.com/";
    navigator.clipboard.writeText(text).then(()=>{btn.textContent="Copied!";setTimeout(()=>btn.textContent="Copy result",1500)}).catch(()=>{});
  };
}

function compute(){
  if(!activeTool)return;
  let r,lines=[];
  try{
    switch(activeTool){
      case "paycheck":{
        let gross=num("gross"),rate=num("rate"),factor=$("#f_period").value;
        let net=gross*(1-rate/100);
        let count={weekly:52,biweekly:26,semimonthly:24,monthly:12}[factor];
        r=money(net);
        lines=[["Estimated deductions",money(gross-net)],["Gross annualized",money(gross*count)],["Net annualized",money(net*count)]];
        break;
      }
      case "salary":{
        let wage=num("wage"),hours=num("hours"),weeks=num("weeks");
        r=money(wage*hours*weeks);
        lines=[["Weekly",money(wage*hours)],["Monthly average",money(wage*hours*weeks/12)],["Hourly rate",money(wage)]];
        break;
      }
      case "timecard":{
        let h=num("hours"),rate=num("rate"),ot=Math.min(h,num("overtime")),mult=num("otmult");
        let gross=(h-ot)*rate+ot*rate*mult;
        r=money(gross);
        lines=[["Regular hours",`${(h-ot).toFixed(2)} hrs`],["Overtime hours",`${ot.toFixed(2)} hrs`],["Estimated gross pay",money(gross)]];
        break;
      }
      case "loan":{
        let p=num("principal"),monthly=num("apr")/1200,n=num("term")*12;
        let pay=monthly===0?p/n:p*monthly/(1-Math.pow(1+monthly,-n));
        r=money(pay)+"/mo";
        lines=[["Number of payments",String(n)],["Total paid",money(pay*n)],["Total interest",money(pay*n-p)]];
        break;
      }
      case "tax":{
        let p=num("price"),tax=p*num("rate")/100;
        r=money(p+tax);
        lines=[["Price before tax",money(p)],["Estimated sales tax",money(tax)]];
        break;
      }
      case "discount":{
        let p=num("price"),rate=num("rate");
        let sale=p*(1-rate/100);
        r=money(sale);
        lines=[["You save",money(p-sale)],["Discount applied",rate+"%"]];
        break;
      }
      case "tip":{
        let bill=num("bill"),rate=num("rate"),people=Math.max(1,num("people"));
        let tip=bill*rate/100,total=bill+tip;
        r=money(total/people)+" each";
        lines=[["Tip amount",money(tip)],["Total with tip",money(total)],["Per person",money(total/people)]];
        break;
      }
      case "percent":{
        let a=num("a"),b=num("b"),mode=$("#f_mode").value;
        if(mode==="of"){r=(a/100*b).toFixed(2);lines=[["Calculation",`${a}% of ${b}`]];}
        else if(mode==="is"){r=((a/b)*100).toFixed(2)+"%";lines=[["Calculation",`${a} is what % of ${b}`]];}
        else{let pct=((b-a)/a)*100;r=pct.toFixed(2)+"%";lines=[["Difference",(b-a).toLocaleString("en-US")],["Direction",pct>0?"Increase":pct<0?"Decrease":"No change"]];}
        break;
      }
      case "grade":{
        let cur=num("current"),w=num("weight")/100,target=num("target");
        if(w<=0||w>1)throw new Error("Exam weight must be between 0 and 100.");
        let needed=(target-cur*(1-w))/w;
        r=needed.toFixed(1)+"%";
        lines=[["Current weighted", (cur*(1-w)).toFixed(1)+"%"],["Exam weight", (w*100)+"%"],["Needed on final", needed.toFixed(1)+"%"]];
        break;
      }
      case "overtime":{
        let h=num("hours"),rate=num("rate"),mult=num("mult");
        r=money(h*rate*mult);
        lines=[["Overtime hours",h.toFixed(2)],["Rate × multiplier",money(rate*mult)+"/hr"]];
        break;
      }
      case "schedule":{
        const days=[["Monday","mon"],["Tuesday","tue"],["Wednesday","wed"],["Thursday","thu"],["Friday","fri"],["Saturday","sat"],["Sunday","sun"]];
        let totalMinutes=0,scheduledDays=0,dayLines=[];
        for(const [label,key] of days){
          const start=$("#f_"+key+"_start").value,end=$("#f_"+key+"_end").value,breakInput=$("#f_"+key+"_break").value;
          if(!start&&!end)continue;
          if(!start||!end)throw new Error(`Enter both start and end times for ${label}, or leave both blank for a day off.`);
          const toMin=t=>{const [h,m]=t.split(":").map(Number);return h*60+m};
          let duration=toMin(end)-toMin(start);
          if(duration<=0)duration+=1440;
          const breakMin=Number(breakInput||0);
          if(!Number.isFinite(breakMin)||breakMin<0||breakMin>duration)throw new Error(`Check the unpaid break for ${label}. It must be between 0 and the shift length.`);
          const net=duration-breakMin;
          totalMinutes+=net;
          scheduledDays++;
          dayLines.push([label,`${Math.floor(net/60)} hr ${net%60} min`]);
        }
        if(scheduledDays===0)throw new Error("Enter at least one work shift to calculate your schedule.");
        const hours=totalMinutes/60;
        const wageValue=$("#f_scheduleWage").value;
        r=`${hours.toFixed(2)} hours`;
        lines=[["Scheduled workdays",String(scheduledDays)],["Total time worked",`${Math.floor(totalMinutes/60)} hr ${totalMinutes%60} min`],["Average per scheduled day",`${(hours/scheduledDays).toFixed(2)} hours`],...dayLines];
        if(wageValue!==""){
          const wage=Number(wageValue);
          if(!Number.isFinite(wage)||wage<0)throw new Error("Hourly wage must be zero or more.");
          lines.push(["Estimated gross weekly pay",money(hours*wage)]);
        }
        break;
      }
      case "age":{
        let b=new Date($("#f_birth").value+"T12:00:00"),a=new Date($("#f_asof").value+"T12:00:00");
        if(Number.isNaN(b.getTime())||Number.isNaN(a.getTime())||b>a)throw new Error("Please enter valid dates, with the calculation date on or after the birth date.");
        let y=a.getFullYear()-b.getFullYear(),m=a.getMonth()-b.getMonth(),d=a.getDate()-b.getDate();
        if(d<0){m--;d+=new Date(a.getFullYear(),a.getMonth(),0).getDate()}
        if(m<0){y--;m+=12}
        r=`${y} years, ${m} months, ${d} days`;
        const totalDays=Math.round((a-b)/86400000);
        lines=[["Total days lived",totalDays.toLocaleString("en-US")],["Next birthday in", (()=>{let next=new Date(a.getFullYear(),b.getMonth(),b.getDate());if(next<=a)next.setFullYear(next.getFullYear()+1);return Math.round((next-a)/86400000)+" days"})()]];
        break;
      }
      case "bmi":{
        let w=num("weight"),h=num("height");
        const wunit=$("#f_wunit").value, hunit=$("#f_hunit").value;
        if(w<=0||h<=0)throw new Error("Weight and height must be greater than zero.");
        let kg=w, m=h;
        if(wunit==="lb")kg=w*0.45359237;
        if(hunit==="in")m=h*0.0254;
        else if(hunit==="cm")m=h/100;
        if(m<=0)throw new Error("Height must be greater than zero.");
        const bmi=kg/(m*m);
        let cat="Underweight";
        if(bmi>=18.5)cat="Normal weight";
        if(bmi>=25)cat="Overweight";
        if(bmi>=30)cat="Obesity";
        r=bmi.toFixed(1);
        lines=[["Category (WHO adult)",cat],["Weight used",`${kg.toFixed(1)} kg`],["Height used",`${(m*100).toFixed(1)} cm`]];
        break;
      }
      case "datediff":{
        const s=new Date($("#f_start").value+"T12:00:00");
        const e=new Date($("#f_end").value+"T12:00:00");
        if(Number.isNaN(s.getTime())||Number.isNaN(e.getTime()))throw new Error("Please enter valid dates.");
        let diff=Math.round((e-s)/86400000);
        if($("#f_inclusive").value==="yes")diff=Math.abs(diff)+1;
        else diff=Math.abs(diff);
        const weeks=Math.floor(diff/7), days=diff%7;
        r=`${diff} days`;
        lines=[["Whole weeks",String(weeks)],["Extra days",String(days)],["Approx. months", (diff/30.44).toFixed(1)]];
        break;
      }
      case "mortgage":{
        let p=num("principal"), monthly=num("apr")/1200, n=num("term")*12;
        if(p<=0||n<=0)throw new Error("Loan amount and term must be greater than zero.");
        let pay=monthly===0?p/n:p*monthly/(1-Math.pow(1+monthly,-n));
        r=money(pay)+"/mo";
        lines=[["Number of payments",String(n)],["Total paid",money(pay*n)],["Total interest",money(pay*n-p)],["Principal",money(p)]];
        break;
      }
      case "compound":{
        let p=num("principal"), rate=num("rate")/100, years=num("years"), n=Number($("#f_freq").value);
        if(p<0||years<=0||n<=0)throw new Error("Enter a valid starting amount, years, and compounding frequency.");
        const amount=p*Math.pow(1+rate/n, n*years);
        const interest=amount-p;
        r=money(amount);
        lines=[["Interest earned",money(interest)],["Starting amount",money(p)],["Effective growth",((amount/p-1)*100).toFixed(1)+"%"]];
        break;
      }
    }
    const formula = toolMeta[activeTool]?.formula || "";
    result(r,lines,formula);
  }catch(err){
    $("#calcResult").hidden=false;
    $("#calcResult").innerHTML=`<div class="result-label">CHECK YOUR INPUT</div><div style="font-size:13px;margin-top:7px">${err.message}</div>`;
  }
}

function openCalc(key){
  if(key==="percentage") key="percent";
  if(!toolMeta[key])return;
  activeTool=key;
  const meta=toolMeta[key];
  $("#dialogTitle").textContent=meta.title;
  $("#dialogCategory").textContent=meta.category;
  $("#calcDisclaimer").textContent=meta.disclaimer;
  const fields=$("#calcFields");
  fields.classList.toggle("schedule-mode",key==="schedule");
  fields.replaceChildren(...(meta.custom?[addScheduleFields()]:meta.fields.map(addField)));
  $("#calcResult").hidden=true;
  dialog.showModal();
  history.replaceState(null,"","#"+key);
  if(!liveBound){
    fields.addEventListener("input",()=>compute());
    fields.addEventListener("change",()=>compute());
    liveBound=true;
  }
  setTimeout(compute,0);
}

function initApp(){
  const toolGrid = $("#toolGrid");
  if(toolGrid){
    toolGrid.addEventListener("click", e => {
      const card = e.target.closest(".tool-card");
      if(card && card.dataset.tool){
        if(card.tagName === "A" && card.getAttribute("href")) return;
        openCalc(card.dataset.tool);
      }
    });
  }
  const closeBtn = $("#closeDialog");
  if(closeBtn) closeBtn.addEventListener("click", () => {
    dialog.close();
    history.replaceState(null, "", location.pathname + location.search);
  });
  if(dialog){
    dialog.addEventListener("click", e => {
      if(e.target === dialog){
        dialog.close();
        history.replaceState(null, "", location.pathname + location.search);
      }
    });
    dialog.addEventListener("close", () => {
      if(location.hash) history.replaceState(null, "", location.pathname + location.search);
    });
  }
  const form = $("#calcForm");
  if(form) form.addEventListener("submit", e => { e.preventDefault(); compute(); });
  if(location.hash){
    const key = location.hash.slice(1);
    if(toolMeta[key]) setTimeout(() => openCalc(key), 50);
  }
  window.addEventListener("hashchange", () => {
    const key = location.hash.slice(1);
    if(toolMeta[key] && (!dialog.open || activeTool !== key)) openCalc(key);
  });
  const search = $("#toolSearch");
  let category = "all";
  function filterTools(){
    if(!search) return;
    let q = search.value.toLowerCase().trim(), shown = 0;
    document.querySelectorAll(".tool-card").forEach(card => {
      let matchCat = category === "all" || card.dataset.category === category;
      let matchText = (card.innerText + " " + (card.dataset.keywords || "")).toLowerCase().includes(q);
      let visible = matchCat && matchText;
      card.hidden = !visible;
      if(visible) shown++;
    });
    const noRes = $("#noResults");
    if(noRes) noRes.hidden = shown !== 0;
  }
  if(search) search.addEventListener("input", filterTools);
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      category = tab.dataset.category;
      document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
      filterTools();
    });
  });
  const yearEl = $("#year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();
  const pageTool = window.PAGE_TOOL || document.body?.dataset?.openTool;
  if(pageTool && toolMeta[pageTool]){
    setTimeout(() => openCalc(pageTool), 60);
  } else if(pageTool === "percentage" && toolMeta.percent){
    setTimeout(() => openCalc("percent"), 60);
  }
  const openBtn = $("#openToolBtn");
  if(openBtn){
    openBtn.addEventListener("click", () => {
      const key = window.PAGE_TOOL || document.body?.dataset?.openTool;
      if(key === "percentage" && toolMeta.percent) openCalc("percent");
      else if(key && toolMeta[key]) openCalc(key);
    });
  }
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
