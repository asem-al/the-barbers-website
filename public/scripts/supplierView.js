const gVars = {
    userInfo: {},
    appointmants: {},
    selected_employee: "",
    selected_date: "",
};

(async function () {
    await init();
    createTable();
    await getAppo();
    fillTable();
})();

setInterval(refresh, 300000); // 5m

async function refresh() {
    await getAppo();
    fillTable();
}

async function init() {
    const userInfoRaw = await fetch("/user", {
        method: "GET",
    });
    const userInfo = await userInfoRaw.json();
    gVars.userInfo = userInfo.data[0];

    gVars.selected_date = document.getElementById("date").valueAsDate = new Date();

    document.getElementById("date").addEventListener("change", handleDateChange);
    document.getElementById("employee").addEventListener("change", handleEmployeeChange);

    // if (gVars.selected_employee != "admin")
    //     document.getElementById("employee").setAttribute("disabled", "disabled");
    if (userInfo.data[0].openinghour || userInfo.data[0].employees.length) {
        const subject = document.getElementById("employee");
        let buff;
        for (let i = 0; i < gVars.userInfo.employees.length; i++) {
            buff += `<option value="${gVars.userInfo.employees[i].name}">${gVars.userInfo.employees[i].name}</option>`;
        }
        subject.insertAdjacentHTML("afterbegin", buff);

        gVars.selected_employee = document.getElementById("employee").value;

        await getAppo();
    }
}

async function getAppo() {
    const appointmantsRaw = await fetch("/data", {
        method: "GET",
    });
    const appointmants = await appointmantsRaw.json();
    gVars.appointmants = appointmants.data;
}

function createTable() {
    const subject = document.getElementById("table");
    let table = "";
    for (let hour = gVars.userInfo.openinghour; hour < gVars.userInfo.closeinghour; hour++) {
        for (let minute = 0; minute < 60; minute += gVars.userInfo.shortestAppointmant) {
            table += `  <tr id= "${hour * 60 + minute}" class="Row">
                            <td class="cln1">${secToTime((hour * 60 + minute) * 60)}</td>
                            <td class="cln2"></td>
                        </tr>`;
        }
    }
    subject.insertAdjacentHTML("afterbegin", table);
}

async function fillTable() {
    const rows = document.getElementsByClassName("Row");
    for (let i = 0; i < rows.length; i++) {
        rows[i].children[1].innerHTML = "";
    }

    const selected_date = new Date(new Date(gVars.selected_date).setHours(0, 0, 0, 0));
    const next_day = new Date(new Date(selected_date).setDate(selected_date.getDate() + 1));
    const appos = gVars.appointmants.filter((el) => {
        if (el.employee === gVars.selected_employee && el.state === "Active" && new Date(el.date) >= selected_date && new Date(el.date) <= next_day)
            return true;
        return false;
    });
    console.log(appos);
    let time;
    let el;
    for (let i = 0; i < appos.length; i++) {
        time = new Date(appos[i].date);
        el = document.getElementById(time.getHours() * 60 + time.getMinutes());
        if (el) el.children[1].innerHTML = `${appos[i].name},  ${appos[i].phoneNumber}`;
    }
}

function handleDateChange() {
    gVars.selected_date = document.getElementById("date").value;
    fillTable();
}

function handleEmployeeChange() {
    gVars.selected_employee = document.getElementById("employee").value;
    fillTable();
}

function secToTime(sec) {
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec % 3600) / 60);
    //let seconds = sec % 60;

    const period = hours >= 12 ? "م" : "ص";

    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)

    return padZero(hours) + ":" + padZero(minutes) + "&nbsp" + period;
}

function padZero(num) {
    return (num < 10 ? "0" : "") + num;
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
