let userInfo = {};
let appointments = [];
let map;
// get data ------------------------

const getuserinfo = async () => {
  let userInfo = await fetch("/user/public", {
    method: "get",
  });
  userInfo = (await userInfo.json()).data;
  return userInfo;
};

const getAppData = async () => {
  let getAppData = await fetch("/data", {
    method: "get",
  });
  getAppData = await getAppData.json();
  return getAppData.data;
};

(async () => {
  userInfo = await getuserinfo();

  for (let i = 0; i < userInfo.branches.length; i++) {
    for (let j = 0; j < userInfo.branches[i].holidays.length; j++) {
      userInfo.branches[i].holidays[j] = new Date(userInfo.branches[i].holidays[j]).setHours(0, 0, 0, 0);
    }
  }
  appointments = await getAppData();

  console.log(appointments);

  for (let i = 0; i < appointments.length; i++) {
    appointments[i].date = new Date(appointments[i].date);
  }

  console.log(userInfo);

  if (userInfo.branches.length < 1) {
    showWelcomeMsg();
  }

  fillcarousel();

  form.init();

  populateProducts();

  initMap();

  fillBusinessInfo();
  fillContactInfo();
})();

function showWelcomeMsg() {
  document.getElementById("welcome-msg").classList.remove("hidden");
}
//console.log(document.forms[0].elements["name"]);
// init form ------------------------
const form = {
  // inputs
  nameSel: document.getElementById("name"),
  phoneSel: document.getElementById("phone"),
  branchSel: document.getElementById("branch-input"),
  barberSel: document.getElementById("barber-input"),
  dateSel: document.getElementById("date-input"),
  timeSel: document.getElementById("time-input"),

  // properties
  name: "",
  phone: "",
  branch: "",
  barber: "",
  date: new Date(),
  time: undefined,

  selectedBranch: 0,
  selectedBarber: 0,
  weekDay: undefined,
  appointmantDuration: undefined,
  start: undefined,
  end: undefined,
  weekend: [],
  breaks: [],
  holidays: [],
  bookedTimes: [],

  init: function () {
    this.setEventsListeners();
    this.updateState();
    this.populateBranch();
    this.populateBarber();
    this.populateDate();
    this.populateTime();
    this.autoFillFromLocalstorage();
  },

  setEventsListeners: function () {
    this.phoneSel.addEventListener("input", () => {
      let inputValue = this.phoneSel.value;
      let filteredValue = inputValue.replace(/[^0-9]/g, "");
      if (inputValue !== filteredValue) {
        this.phoneSel.value = filteredValue;
      }
    });
    this.branchSel.addEventListener("change", (event) => this.handleBranchChange(event));
    this.barberSel.addEventListener("change", (event) => this.handleBarberChange(event));
    this.dateSel.addEventListener("change", (event) => this.handleDateChange(event));
  },
  thisDateIsBookedForAllBarbers: function (date) {
    let found = true;
    userInfo.branches[this.selectedBranch].employees.forEach((barber) => {
      if (
        appointments
          .filter((appointment) => appointment.employee === barber.name)
          .findIndex((appointment) => appointment.date.getTime() === date.getTime()) === -1
      )
        found = false;
    });
    return found;
  },
  updateState: function () {
    this.appointmantDuration = userInfo.branches[this.selectedBranch].shortestAppointmant;
    this.weekDay = this.date.getDay();
    this.weekend = userInfo.branches[this.selectedBranch].weekend;
    this.start = userInfo.branches[this.selectedBranch].weekschedule[this.weekDay].opening;
    this.end = userInfo.branches[this.selectedBranch].weekschedule[this.weekDay].closing;

    this.breaks = userInfo.branches[this.selectedBranch].breaks.filter((el) => el.for === "everyday" || el.for === this.weekDay);
    this.holidays = userInfo.branches[this.selectedBranch].holidays;

    this.bookedTimes = appointments
      .filter((el) => {
        if (this.barber !== "any") {
          return this.branch === el.branch && this.barber === el.employee && this.isDatesAtSameDay(this.date, el.date);
        }
        return this.branch === el.branch && this.isDatesAtSameDay(this.date, el.date) && this.thisDateIsBookedForAllBarbers(el.date);
      })
      .map((el) => el.date.getHours() * 60 + el.date.getMinutes());
  },

  autoFillFromLocalstorage: function () {
    // try to fill from local storage.
    if (typeof Storage !== "undefined" && localStorage) {
      let appointment;

      if (localStorage.code && localStorage.phoneNumber) {
        appointment = {
          employee: localStorage.getItem("employee"),
          code: localStorage.getItem("code"),
          date: new Date(localStorage.getItem("date")).toLocaleString(),
          branch: localStorage.getItem("branch"),
          phoneNumber: localStorage.getItem("phoneNumber"),
          clientName: localStorage.getItem("clientName"),
        };
        this.nameSel.value = appointment.clientName;
        this.phoneSel.value = appointment.phoneNumber;
        this.branchSel.value = appointment.branch;
        this.branchSel.dispatchEvent(new Event("change"));
        this.barberSel.value = appointment.employee;
        this.barberSel.dispatchEvent(new Event("change"));
      }

      const now = new Date();
      const stored = new Date(localStorage.getItem("date"));

      if (stored.getTime() > now.getTime() - this.appointmantDuration * 2 * 60 * 1000) {
        showAppointmentMsg(appointment);
      }
    }
  },

  populateBranch: function () {
    // branch
    this.clearOptions(this.branchSel);
    for (let i = 0; i < userInfo.branches.length; i++) {
      const option = document.createElement("option");
      option.value = userInfo.branches[i].name;
      option.text = userInfo.branches[i].name;
      this.branchSel.add(option);
    }
  },

  populateBarber: function () {
    // barber
    this.clearOptions(this.barberSel);
    // const option = document.createElement("option");
    // option.value = "any";
    // option.text = "any";
    // this.barberSel.add(option);
    for (let i = 0; i < userInfo.branches[this.selectedBranch].employees.length; i++) {
      const option = document.createElement("option");
      option.value = option.text = userInfo.branches[this.selectedBranch].employees[i].name;
      if (userInfo.branches[this.selectedBranch].employees[i].avaliable === false) {
        option.disabled = true;
      }
      this.barberSel.add(option);
    }
  },

  populateDate: function () {
    // Date
    this.clearOptions(this.dateSel);
    let today = new Date(new Date().setHours(0, 0, 0, 0));

    for (let i = 0; i < 16; i++) {
      const option = document.createElement("option");
      option.value = today.toString();
      option.text = today.toLocaleDateString();

      if (this.weekend.includes(today.getDay()) || this.holidays.includes(today.getTime())) {
        option.disabled = true;
      }

      this.dateSel.add(option);
      today.setDate(today.getDate() + 1);
    }
  },

  populateTime: function () {
    // Time
    this.clearOptions(this.timeSel);

    this.date = new Date(this.dateSel.value);

    for (let i = this.start; i < this.end; i += this.appointmantDuration) {
      let disabled = false;

      const now = new Date().getHours() * 60 + new Date().getMinutes();

      if (this.breaks.some((el) => i >= el.start && i <= el.end) || (i < now && this.isDateToday(this.date)) || this.bookedTimes.includes(i)) {
        disabled = true;
      }

      const option = document.createElement("option");
      option.value = minutesToTime(i);
      option.text = minutesToTime(i);
      option.disabled = disabled;
      this.timeSel.add(option);
    }
  },

  handleBranchChange: function (event) {
    this.selectedBranch = userInfo.branches.findIndex((el) => el.name === event.target.value);
    this.branch = event.target.value;
    this.updateState();
    this.populateBarber();
    this.populateDate();
    this.populateTime();
  },
  handleBarberChange: function (event) {
    this.selectedBarber = userInfo.branches[this.selectedBranch].employees.findIndex((el) => el.name === event.target.value);
    this.barber = event.target.value;
    this.updateState(); //// ????
    this.populateTime();
  },
  handleDateChange: function (event) {
    this.date = new Date(event.target.value);
    this.updateState();
    this.populateTime();
  },
  // handleTimeChange: function (event) {
  //   this.time = timeToMinutes(event.target.value);
  // },

  clearOptions: function (selectSel) {
    while (selectSel.length > 0) {
      selectSel.remove(0);
    }
  },

  isDateToday: function (inputDate) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const inputDateCopy = new Date(inputDate);
    inputDateCopy.setHours(0, 0, 0, 0);
    return currentDate.getTime() === inputDateCopy.getTime();
  },
  isDatesAtSameDay: function (date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.setHours(0, 0, 0, 0) === d2.setHours(0, 0, 0, 0);
  },
};

// send ------------------------

const send = async () => {
  try {
    const form = document.getElementById("appointmantform");
    const formData = new FormData(form);

    const jsonObject = {};
    formData.forEach((value, key) => {
      jsonObject[key] = value;
    });
    console.log(jsonObject);

    const responseRow = await fetch("/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonObject),
    });

    const response = await responseRow.json();

    if (response.status === "success") {
      saveUserPreferences(response.data);
      response.data.date = new Date(response.data.date).toLocaleString();
      showAppointmentMsg(response.data);
    } else if (response.status === "fail") {
      if (responseRow.status === 400) {
        showFailMsg(response.message);
      } else if (responseRow.status === 500) {
        showErrorMsg();
      }
    }
  } catch (error) {
    console.error("Error sending data:", error);
    showErrorMsg();
  }
};

function showAppointmentMsg(data) {
  const template = document.getElementById("appointmant-info-msg-template");
  const element = template.content.cloneNode(true);

  const content = element.querySelector("p").innerHTML.replace(/{{(.*?)}}/g, (match, key) => data[key]);
  element.querySelector("p").innerHTML = content;

  document.querySelector(".notification").appendChild(element);
}

function showFailMsg(msg) {
  const template = document.getElementById("appointmant-fail-msg-template");
  const element = template.content.cloneNode(true);
  const content = element.querySelector("p").innerHTML.replace(/{{(.*?)}}/g, (match, key) => msg);
  element.querySelector("p").innerHTML = content;
  document.querySelector(".notification").appendChild(element);
}

function showErrorMsg() {
  const template = document.getElementById("error-msg-template");
  const element = template.content.cloneNode(true);

  document.querySelector(".notification").appendChild(element);
}

function saveUserPreferences(data) {
  if (typeof Storage !== "undefined") {
    localStorage.clear();
    localStorage.setItem("date", data.date);
    localStorage.setItem("branch", data.branch);
    localStorage.setItem("clientName", data.clientName);
    localStorage.setItem("employee", data.employee);
    localStorage.setItem("phoneNumber", data.phoneNumber);
    localStorage.setItem("code", data.code);
  } else {
    console.log("Local storage is not supported.");
  }
}

// carousel ------------------------
const carousel = {
  sel: document.querySelector(".x-carousel"),
  autoScrolling: false,
  scrollingManuallyStopped: false,
  autoScrollTimer: null,
  isDragging: false,
  startPosition: 0,
  visible: false,
  dragDistance: 0,
  maxScrollWidth: 0,
  isRTL: window.getComputedStyle(document.querySelector(".x-carousel")).direction === "rtl",
  scrolled: 0,

  scroll: function (n) {
    this.sel.scrollLeft += n;
  },

  startAutoScroll: function () {
    if (!this.scrollingManuallyStopped) {
      clearInterval(this.autoScrollTimer);

      this.autoScrollTimer = setInterval(() => {
        this.scroll(this.isRTL ? -2 : 2);
      }, 30);

      this.autoScrolling = true;
    }
  },

  stopAutoScroll: function () {
    clearInterval(this.autoScrollTimer);
    this.autoScrolling = false;
  },

  checkCarouselVisibility: function () {
    const rect = this.sel.getBoundingClientRect();
    if (rect.top < 180 && rect.bottom > -340) {
      this.visible = true;
    } else {
      this.visible = false;
    }
    return this.visible;
  },

  startIfVisible: function () {
    if (this.checkCarouselVisibility() && !this.autoScrolling && !this.scrollingManuallyStopped) {
      this.startAutoScroll();
    }
  },
};

const handle_mousedown = (event) => {
  carousel.isDragging = true;
  carousel.stopAutoScroll();
  carousel.dragDistance = 0;
  carousel.startPosition = event.clientX;
};
const handle_mousemove = (event) => {
  if (carousel.isDragging) {
    carousel.dragDistance = event.clientX - carousel.startPosition;
    carousel.scroll(-carousel.dragDistance);
    carousel.startPosition = event.clientX;
  }
};

const handle_mouseup = (event) => {
  if (carousel.isDragging && !carousel.autoScrolling) {
    if (carousel.dragDistance === 0) {
      carousel.scrollingManuallyStopped = !carousel.scrollingManuallyStopped;
    }
    carousel.startAutoScroll();
  }
  carousel.isDragging = false;
};

const handle_touchstart = (event) => {
  carousel.isDragging = true;
  carousel.stopAutoScroll();
  carousel.dragDistance = 0;
  carousel.startPosition = event.touches[0].clientX;
};

const handle_touchmove = (event) => {
  if (carousel.isDragging) {
    carousel.dragDistance = event.touches[0].clientX - carousel.startPosition;
    // carousel.scroll(-carousel.dragDistance); // relay on default behaviour
    carousel.startPosition = event.touches[0].clientX;
  }
};

const handle_touchend = (event) => {
  if (carousel.isDragging && !carousel.autoScrolling) {
    carousel.startAutoScroll();
  }
  carousel.isDragging = false;
};

carousel.sel.addEventListener("mousedown", handle_mousedown);

carousel.sel.addEventListener("mousemove", handle_mousemove);

carousel.sel.addEventListener("mouseup", handle_mouseup);

carousel.sel.addEventListener("touchstart", handle_touchstart);

carousel.sel.addEventListener("touchmove", handle_touchmove);

carousel.sel.addEventListener("touchend", handle_touchend);

carousel.sel.addEventListener("wheel", function (event) {
  if (event.ctrlKey) {
    event.preventDefault();

    carousel.scroll(event.deltaY);
  }
});

document.addEventListener("scroll", () => {
  carousel.startIfVisible();
});
window.addEventListener("resize", () => {
  carousel.startIfVisible();
});

// shop ------------------------

function populateProducts() {
  if (userInfo.products && userInfo.products.length) {
    const productTemplate = document.getElementById("product-template");
    const productsContainer = document.querySelector(".products-container");
    productsContainer.innerHTML = "";
    for (let i = 0; i < userInfo.products.length; i++) {
      const product = productTemplate.content.cloneNode(true);

      product.querySelector("div").innerHTML = product.querySelector("div").innerHTML.replace(/{{(.*?)}}/g, (match, key) => {
        if (key === "image") return "public/images/" + userInfo.username + "/products/" + "prod-" + userInfo.products[i]["id"] + ".jpeg";
        return userInfo.products[i][key];
      });
      productsContainer.appendChild(product);
    }
    // addEventListener
    document.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        card.classList.toggle("expanded-card");
        card.querySelector(".overflow-indicator")?.classList.toggle("hidden");
        document.getElementById("overlay").classList.toggle("hidden");
      });
      const description = card.querySelector(".description");
      if (description.scrollHeight > description.clientHeight) {
        description.classList.add("overflowing");
      }
    });
    document.querySelectorAll(".overflowing").forEach((el) => {
      // Create a new span element
      const spanElement = document.createElement("span");

      spanElement.classList.add("overflow-indicator");
      el.insertAdjacentElement("afterend", spanElement);
    });
  } else {
    document.getElementById("shop-section").classList.add("hidden");
  }
}

// Map ------------------------

function initMap() {
  if (userInfo.branches.length) {
    let mode = "";
    let quiry = "";
    if (userInfo.branches.length === 1) {
      mode = "place";
      quiry = userInfo.branches[0].fulladdress.replace(" ", "+");
    } else {
      if (form.branch) {
        mode = "place";
        quiry = userInfo.branches[form.selectedBranch].fulladdress.replace(" ", "+");
      } else {
        mode = "search";
        quiry = userInfo.businessName.replace(" ", "+");
      }
    }

    let key = "AIzaSyDq-MnlCHmGHR0CJJdOnV8OWFBuUOQ42po";

    document.getElementById("map").src = `https://www.google.com/maps/embed/v1/${mode}?key=${key}&q=${quiry}`;
  }
}

// business info ------------------------

function fillBusinessInfo() {
  document.getElementById("p-address").innerHTML = userInfo.branches[0].fulladdress;

  let open, close, weekDay;
  const date = new Date(Date.UTC(2012, 11, 16, 3, 0, 0));
  let scheduleString = "";

  for (let i = 0; i < 7; i++) {
    open = minutesToTime(userInfo.branches[0].weekschedule[i].opening);
    close = minutesToTime(userInfo.branches[0].weekschedule[i].closing);
    weekDay = date.toLocaleDateString(undefined, { weekday: "long" });
    scheduleString += weekDay + ": " + open + " - " + close + "<br/>";
    date.setDate(date.getDate() + 1);
  }

  document.getElementById("p-weekschedule").innerHTML = scheduleString;
}

// Contact Us ------------------------

function fillContactInfo() {
  const phone = userInfo.phoneNumber;
  const email = userInfo.email;
  document.getElementById("p-phone").innerHTML = `<a href="tel:${phone}">${phone}</a>`;
  document.getElementById("a-phone").innerHTML = `<a href="tel:${phone}">${phone}</a>`;
  document.getElementById("p-email").innerHTML = email;
  document.getElementById("p-businessname").innerHTML = "&copy; " + userInfo.businessName;
}

// carousel ------------------------

function fillcarousel() {
  const carousel = document.getElementById("carousel-con");
  carousel.innerHTML = "";
  userInfo.userMediaAndContent.media.images.forEach((image) => {
    carousel.innerHTML += `<img class="x-carousel-img" src="${
      "public/images/" + userInfo.username + "/gallery/" + image
    }" alt="" draggable="false" />`;
  });
}
function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  } else {
    console.log("Geolocation is not supported by your browser");
  }
  // TODO calc the closest branch to chose it on the map and selected in the form.
  // const closestBranch = {name:'branch1',lon: 35, lat: 38};

  // how to draw the map?
  // - first send a mab with all beanches with the website.
  // - then when determining the closest branch, send a requist to the server to get a new map as html.
  // - in the sever, draw the map in the server with centering to the closest branch and bigger zooming level and respone with it.
}

function successCallback(position) {
  console.log(position);
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  // You can now use this information, for example, to display a map or perform location-based actions.
}

function errorCallback(error) {
  console.log(`Error occurred: ${error.message}`);
}

function today() {
  return new Date();
}

function formatDate(date) {
  const year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0"); // Adding leading zero if needed
  let day = date.getDate().toString().padStart(2, "0"); // Adding leading zero if needed
  return `${year}-${month}-${day}`;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
function timeToMinutes(timeStr) {
  const arr = timeStr.split(":");
  return Number(arr[0]) * 60 + Number(arr[1]);
}
