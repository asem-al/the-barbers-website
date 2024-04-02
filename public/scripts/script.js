const gVars = {
    username: "",
    shortestAppointmant: 0,
    selected_employee: "",
    selected_time: 0,
    selected_date: "",
    appointmants: [],
    times: [],
};

(function () {
    initForm();
    init();

    console.log(gVars);
})();

async function send() {
    const date = new Date(gVars.selected_date);
    const reqBody = {
        user: gVars.username,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(gVars.selected_time / 60), gVars.selected_time % 60),
        duration: gVars.shortestAppointmant,
        employee: gVars.selected_employee,
        name: document.getElementById("fname").value,
        phoneNumber: document.getElementById("phone").value,
        details: "no details",
    };

    let message = "";
    //if (reqBody.name && reqBody.employee && reqBody.phoneNumber && req.data >= new Date())
    if (!(reqBody.date >= new Date())) message = "الوقت او التاريخ المختار قد مضى!";
    if (!gVars.selected_time) message = "اختر الوقت";
    if (!reqBody.name) message = "الاسم فارغ!";
    if (!reqBody.phoneNumber) message = "يجب ادخال رقم هاتف";
    if (!reqBody.employee) message = "يجب اختيار الموظف";
    const selected_date = new Date(new Date(gVars.selected_date).setHours(0));
    const today = new Date();
    const today_plus10 = new Date(today.setDate(today.getDate() + 10));
    if (selected_date > today_plus10) message = "لا يمكن اخذ موعد ابعد من 10 ايام";

    if (!message) {
        // TODO Validate data
        try {
            // TODO use the returned data to display a confirmation message
            // ALSO don't allaw users to take many appo by cheacing the phone num
            const resRaw = await fetch("/data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify(reqBody),
            });
            const res = await resRaw.json();
            message = `تم حجز موعد بتاريخ ${new Date(res.data.Appointment.date)} عند ${res.data.Appointment.employee}.`;
            document.querySelector("#notifications > p").innerHTML = message;
            await init();
            await setOpenHours();
            console.log(res);
        } catch (err) {
            console.log(err);
        }
    } else {
        // tell user about messing data
        document.querySelector("#notifications > p").innerHTML = message;
    }
}
// TODO لا يجب ان لزم عمل فلترة للبيانات هنا. يجب نقل هذه العمليات للسيرفر
async function init() {
    const appointmantsRaw = await fetch("/data", {
        method: "GET",
    });

    const appointmants = await appointmantsRaw.json();
    console.log(appointmants);
    const date = new Date().setHours(0, 0, 0, 0);
    gVars.appointmants.length = 0;
    appointmants.data.forEach((el) => {
        if (el.state === "Active" && new Date(el.date) >= date) {
            gVars.appointmants.push({
                employee: el.employee,
                date: new Date(el.date),
            });
        }
    });
    gVars.appointmants.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
}

async function initForm() {
    // const user = window.location.hostname.split(".")[0];
    //const domain = window.location.hostname;

    const userInfoRaw = await fetch("/user", {
        method: "GET",
    });
    const userInfo = await userInfoRaw.json();
    //console.log(userInfo);
    console.log(userInfo);
    if (userInfo.data[0].employees.length === 0 && !userInfo.data[0].openinghour) {
        newUser();
        return;
    }
    let date = new Date();
    if (date.getHours() >= userInfo.data[0].closeinghour) date = new Date(date.setDate(date.getDate() + 1));

    document.getElementById("date").valueAsDate = date;
    gVars.selected_date = date;

    gVars.username = userInfo.data[0].username;
    gVars.shortestAppointmant = userInfo.data[0].shortestAppointmant * 1;

    const el = '<span id="%ID%" class="hidden" onclick="sellectTime(this.id)">%TIME%</span>';
    const timesBox = document.getElementById("box");
    const openinghour = userInfo.data[0].openinghour * 1;
    const closeinghour = userInfo.data[0].closeinghour * 1;
    const shortestAppointmant = userInfo.data[0].shortestAppointmant * 1;

    let buff = 0;
    for (let hour = openinghour; hour < closeinghour; hour++) {
        for (let minute = 0; minute < 60; minute += shortestAppointmant) {
            buff = hour * 60 + minute;
            timesBox.insertAdjacentHTML("beforeend", el.replace("%TIME%", secToTime(buff * 60)).replace("%ID%", `${buff}`));

            gVars.times.push(buff);
        }
    }

    const employeeEl =
        '<span><input type="radio" id="%ID%" name="workerRadio" value=%employeeName% /> <label for="%ID%">%employeeName%</label></span>';
    const namesField = document.getElementById("workers-names-field");
    let employeeName = "";

    for (let i = 0; i < userInfo.data[0].employees.length; i++) {
        employeeName = userInfo.data[0].employees[i].name;
        namesField.insertAdjacentHTML("beforeend", employeeEl.replaceAll("%employeeName%", employeeName).replaceAll("%ID%", `employee${i}`));
    }

    // Add event listener to radio inputs
    const workerRadios = document.getElementsByName("workerRadio");
    for (let i = 0; i < workerRadios.length; i++) {
        workerRadios[i].addEventListener("change", handleRadioChange);
    }
    // Add event listener to date change
    document.getElementById("date").addEventListener("change", handleDateChange);
}

async function setOpenHours() {
    const spans = document.querySelectorAll("#box.cont span");
    const selected_date = new Date(new Date(gVars.selected_date).setHours(0, 0, 0, 0));
    const next_day = new Date(new Date(selected_date).setDate(selected_date.getDate() + 1));
    const times = gVars.appointmants.filter((el) => {
        if (el.employee === gVars.selected_employee && new Date(el.date) >= selected_date && new Date(el.date) <= next_day) return true;
        return false;
    });
    console.log(times);
    const now = new Date();
    let spanDate;
    let appo;
    let time;

    for (let i = 0, c = 0; i < gVars.times.length; i++) {
        spanDate = new Date(
            selected_date.getFullYear(),
            selected_date.getMonth(),
            selected_date.getDate(),
            Math.floor(gVars.times[i] / 60),
            gVars.times[i] % 60
        );

        if (c < times.length) {
            appo = new Date(times[c].date);
            time = appo.getHours() * 60 + appo.getMinutes();
        }

        if (gVars.times[i] === time || spanDate <= now) {
            spans[i].className = "booked";
            spans[i].setAttribute("onclick", "");
            c++;
        } else {
            spans[i].className = "open";
            spans[i].setAttribute("onclick", "sellectTime(this.id)");
        }
    }
}

function handleRadioChange(event) {
    gVars.selected_employee = event.target.value;
    gVars.selected_time = "";
    setOpenHours();

    console.log("selected employee =", gVars.selected_employee);
}

function handleDateChange(event) {
    gVars.selected_date = new Date(new Date(event.target.value).setHours(0, 0, 0, 0));
    gVars.selected_time = "";
    if (gVars.selected_employee) setOpenHours();
}

function sellectTime(time) {
    if (gVars.selected_time) {
        document.getElementById(gVars.selected_time).classList.remove("selected");
    }
    gVars.selected_time = time;
    document.getElementById(gVars.selected_time).classList.add("selected");
    console.log("selected time =", gVars.selected_time);
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

function newUser() {
    const msg = `
        <div id="msg" dir="rtl">
            <h4>مرحباً بكم في موقعكم الجديد. يجب ادخال بعض المعلومات الاضافية عن عملكم ليعمل الموقع بشكل صحيح. <a href="/inituser">من هنا.</a></h4>
            
        </div>
    `;
    document.querySelector("body").insertAdjacentHTML("afterbegin", msg);
}
