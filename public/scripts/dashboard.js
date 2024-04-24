const gVars = {
  userInfo: {},
  appointmants: {},
  selected_branch: 0,
  selected_employee: 0,
  selected_date: new Date(),
};

const dateSel = document.getElementById("date");
const branchSel = document.getElementById("branch");
const barberSel = document.getElementById("barber");
const tableRows = document.getElementsByClassName("row");

(async function () {
  await getuserinfo();
  console.log(gVars.userInfo);
  fillfields();

  await getAppointments();
  console.log(gVars.appointmants);
  createTable();
  fillTable();
})();

setInterval(refresh, 300000); // 5m

async function refresh() {
  await getAppointments();
  fillTable();
}

async function getuserinfo() {
  const userInfoRaw = await fetch("/user", {
    method: "GET",
  });
  const userInfo = await userInfoRaw.json();
  gVars.userInfo = userInfo.data;
}

function fillfields() {
  console.log(gVars.selected_date.toISOString().slice(0, 10));
  dateSel.value = gVars.selected_date.toISOString().slice(0, 10);

  for (let i = 0; i < gVars.userInfo.branches.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = gVars.userInfo.branches[i].name;
    branchSel.add(option);
  }

  fillBarberField();

  dateSel.addEventListener("change", handleDateChange);
  branchSel.addEventListener("change", handleBranchChange);
  barberSel.addEventListener("change", handleEmployeeChange);
}

function fillBarberField() {
  while (barberSel.length > 0) {
    barberSel.remove(0);
  }
  for (let i = 0; i < gVars.userInfo.branches[gVars.selected_branch].employees.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = gVars.userInfo.branches[gVars.selected_branch].employees[i].name;
    barberSel.add(option);
  }
}

async function getAppointments() {
  const appointmantsRaw = await fetch("/data/admin", {
    method: "GET",
  });
  const appointmants = await appointmantsRaw.json();
  for (let i = 0; i < appointmants.data.length; i++) {
    appointmants.data[i].date = new Date(appointmants.data[i].date);
  }
  gVars.appointmants = appointmants.data;
}

function createTable() {
  let tableBody = "";
  const daySchedule = gVars.userInfo.branches[gVars.selected_branch].weekschedule[gVars.selected_date.getDay()];
  const open = daySchedule.opening;
  const close = daySchedule.closing;
  const appDuration = gVars.userInfo.branches[gVars.selected_branch].shortestAppointmant;

  for (let i = open; i < close; i += appDuration) {
    tableBody += `<tr class="row"><td>${minutesToTime(i)}</td><td id="${i}">Free</td></tr>`;
  }
  document.getElementById("table").innerHTML = tableBody;
}

function fillTable() {
  // clear
  for (let i = 0; i < tableRows.length; i++) {
    tableRows[i].children[1].innerHTML = "";
  }
  // filter
  const appos = gVars.appointmants.filter((el) => {
    return (
      el.branch === getBranchName(gVars.selected_branch) &&
      el.employee === getBarberName(gVars.selected_employee) &&
      el.state === "Active" &&
      isDatesAtSameDay(gVars.selected_date, el.date)
    );
  });
  // fill

  let time;
  let field;
  for (let i = 0; i < appos.length; i++) {
    time = appos[i].date;
    field = document.getElementById(time.getHours() * 60 + time.getMinutes());
    const template = document.getElementById("appointmant-info-template");
    const element = template.content.cloneNode(true);

    const content = element.querySelector(".appointment").innerHTML.replace(/{{(.*?)}}/g, (match, key) => appos[i][key]);
    element.querySelector(".appointment").innerHTML = content;

    field.appendChild(element);
  }
}

function getBranchName(index) {
  return gVars.userInfo.branches[index].name;
}

function getBarberName(index) {
  return gVars.userInfo.branches[gVars.selected_branch].employees[index].name;
}

function handleDateChange() {
  gVars.selected_date = new Date(dateSel.value);
  fillTable();
}
function handleBranchChange() {
  gVars.selected_branch = branchSel.value * 1;
  gVars.selected_employee = 0;
  fillBarberField();
  createTable();
  fillTable();
}
function handleEmployeeChange() {
  gVars.selected_employee = barberSel.value * 1;
  fillTable();
}

function isDatesAtSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.setHours(0, 0, 0, 0) === d2.setHours(0, 0, 0, 0);
}

function minutesToTime(timeInMinutes) {
  const time = new Date(2024, 3, 24, Math.floor(timeInMinutes / 60), timeInMinutes % 60);
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ref
// function moveTimeLine() {
//     const container = document.querySelector("#table");
//     const element = document.querySelector("#timeLine");
//     const topp = container.getBoundingClientRect().top;
//     const leftt = container.getBoundingClientRect().left;
//     const containerWidth = container.offsetWidth;
//     const containerHeight = container.offsetHeight;
//     const now = new Date();
//     const minutes = now.getHours() * 60 + now.getMinutes();
//     const newTop = (containerHeight * minutes) / 1440 + topp;

//     element.style.width = containerWidth + "px";
//     element.style.left = leftt + "px";
//     element.style.top = newTop + "px";
//     console.log("f* js");
// }
// function createDiv(minutes, duration) {
//     const newDiv = document.createElement("div");
//     document.getElementById("tableBody").appendChild(newDiv);
//     newDiv.classList.add("appointment");
//     newDiv.id = "the_div_id";
//     const cln1Width = document.querySelector(".cln1").getBoundingClientRect().width;
//     const cln2Width = document.querySelector(".cln2").getBoundingClientRect().width;
//     const container = document.querySelector("#table");
//     const topp = container.getBoundingClientRect().top;
//     const leftt = container.getBoundingClientRect().left;
//     const containerHeight = container.offsetHeight;
//     const heightt = (containerHeight * duration) / 1440;
//     newDiv.style.width = cln2Width + "px";
//     newDiv.style.height = heightt + "px";
//     newDiv.style.left = leftt + cln1Width + "px";
//     newDiv.style.top = topp + (minutes * containerHeight) / 1440 + "px";
//     console.log("div created");
// }
