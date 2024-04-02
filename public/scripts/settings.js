/*
  settings.js
*/

// TODO make a submit on every field change but store the value in user browser to allow Undo.
// note that you can make use of the name attr to update the correct field in db.

// TODO gallery images should be in a flex container when there is on add button and the image can be deleted when pressing on it twice.

// TODO need to add maseges for users. show all the responces massges from server and implement validation.

// TODO First day of the week should be Sunday. update the init and collect functions.

//
const input_username = document.getElementById("username");
const input_password = document.getElementById("password");
const input_email = document.getElementById("email");
const input_phone = document.getElementById("phone");

const input_businessName = document.getElementById("businessName");
const input_branchesnumber = document.getElementById("branchesnumber");

const sections_branches = document.getElementsByClassName("branch");

let userInfo = {};
let availableLanguages = {};
(async () => {
  await getUserInfo();
  availableLanguages = (
    await (
      await fetch("/avaliablelanguages", {
        method: "GET",
      })
    ).json()
  ).avaliablelanguages;

  // f();
  initForm();
})();

function f() {
  // username
  // branches.name
  // branches.employees.name
  let name = "branches.employees.name";
  let x = userInfo;
  let keys = name.split(".");
  for (let i = 0; i < keys.length; i++) {
    x = x[keys[i]];
    console.log(x);
  }
  console.log(x);
}

async function getUserInfo() {
  const userInfoRaw = await fetch("/user", {
    method: "GET",
  });
  userInfo = (await userInfoRaw.json()).data;
  console.log(userInfo);
}

function initForm() {
  // Account Info

  input_username.value = userInfo.username;
  input_email.value = userInfo.email || "";
  input_phone.value = userInfo.phoneNumber || "";

  // Business Info

  input_businessName.value = userInfo.businessName || "";
  input_branchesnumber.value = userInfo.branches.length ? userInfo.branches.length : 1;

  // Branches
  for (let i = 0; i < userInfo.branches.length - 1; i++) {
    cloneElement(sections_branches[0]);
  }

  for (let i = 0; i < userInfo.branches.length; i++) {
    sections_branches[i].querySelector('input[name="branches.name"]').value = userInfo.branches[i].name;
    sections_branches[i].querySelector('input[name="branches.phone"]').value = userInfo.branches[i].phoneNumber;

    // Address

    sections_branches[i].querySelector('input[name="branches.country"]').value = userInfo.branches[i].country;
    sections_branches[i].querySelector('input[name="branches.city"]').value = userInfo.branches[i].city;
    sections_branches[i].querySelector('input[name="branches.district"]').value = userInfo.branches[i].district;
    sections_branches[i].querySelector('input[name="branches.neighborhood"]').value = userInfo.branches[i].neighborhood;
    sections_branches[i].querySelector('input[name="branches.street"]').value = userInfo.branches[i].street;
    sections_branches[i].querySelector('input[name="branches.fulladdress"]').value = userInfo.branches[i].fulladdress;

    // Employees

    const employeeTemplate = sections_branches[i].querySelector(".employee");
    for (let j = 0; j < userInfo.branches[i].employees.length - 1; j++) {
      const el = employeeTemplate.cloneNode(true);
      sections_branches[i].querySelector(".employees-fields-list").appendChild(el);
    }

    const employees = sections_branches[i].querySelectorAll(".employee");
    for (let j = 0; j < employees.length; j++) {
      employees[j].querySelector('input[name="branches.employees.name"]').value = userInfo.branches[i].employees[j].name;
      employees[j].querySelector('input[name="branches.employees.phone"]').value = userInfo.branches[i].employees[j].phoneNumber;
      employees[j].querySelector('input[name="branches.employees.avaliable"]').checked = userInfo.branches[i].employees[j].avaliable;
    }

    // Work Hours

    sections_branches[i].querySelector('input[name="branches.shortestAppointmant"]').value = userInfo.branches[i].shortestAppointmant;

    const weekend_inputs = sections_branches[i].querySelectorAll('input[name="branches.weekend"]');
    for (let j = 0; j < weekend_inputs.length; j++) {
      weekend_inputs[j].checked = userInfo.branches[i].weekend.includes(weekend_inputs[j].value * 1);
    }

    const days = sections_branches[i].querySelectorAll(".aday");
    for (let j = 0; j < days.length; j++) {
      if (userInfo.branches[i].weekschedule[j].opening) {
        days[j].querySelector('input[name="branches.openinghour"]').value = minutesToTime(userInfo.branches[i].weekschedule[j].opening);
        days[j].querySelector('input[name="branches.closeinghour"]').value = minutesToTime(userInfo.branches[i].weekschedule[j].closing);
      } else {
        days[j].querySelector(".aday > fieldset").disabled = true;
      }
    }

    const breakTemplate = sections_branches[i].querySelector(".break");
    for (let j = 0; j < userInfo.branches[i].breaks.length - 1; j++) {
      const el = breakTemplate.cloneNode(true);
      sections_branches[i].querySelector(".breaks-list-container").appendChild(el);
    }

    const breaks = sections_branches[i].querySelectorAll(".break");
    for (let j = 0; j < breaks.length; j++) {
      breaks[j].querySelector('input[name="branches.breaks.start"]').value = minutesToTime(userInfo.branches[i].breaks[j].start);
      breaks[j].querySelector('input[name="branches.breaks.end"]').value = minutesToTime(userInfo.branches[i].breaks[j].end);
      breaks[j].querySelector('select[name="branches.breaks.for"]').value = userInfo.branches[i].breaks[j].for;
    }

    const holidayTemplate = sections_branches[i].querySelector(".holiday");
    for (let j = 0; j < userInfo.branches[i].holidays.length - 1; j++) {
      const el = holidayTemplate.cloneNode(true);
      sections_branches[i].querySelector(".holidays-list-container").appendChild(el);
    }

    const holidays = sections_branches[i].querySelectorAll(".holiday");
    for (let j = 0; j < holidays.length; j++) {
      holidays[j].querySelector('input[name="branches.holidays"]').value = new Date(userInfo.branches[i].holidays[j]).toISOString().slice(0, 10);
    }
  }

  // images
  let imagesTable = document.getElementById("images-table");
  imagesTable.children[0].querySelector(".preview-img").src = userInfo.userMediaAndContent.media.logo;
  imagesTable.children[1].querySelector(".preview-img").src = userInfo.userMediaAndContent.media.heroImage;
  for (let i = 0; i < userInfo.userMediaAndContent.media.images.length; i++) {
    handleAddGallaryImage();
  }
  imagesTable = document.getElementById("images-table");
  for (let i = 0; i < imagesTable.children.length - 2; i++) {
    imagesTable.children[i + 2].querySelector(".preview-img").src = userInfo.userMediaAndContent.media.images[i];
  }
  // other
  const langCheckboxCon = document.querySelector(".languages-selector");
  const langCheckboxTemp = document.getElementById("language-checkbox-template");

  for (let i = 0; i < availableLanguages.length; i++) {
    const langCheckboxEl = langCheckboxTemp.content.cloneNode(true);
    const label = langCheckboxEl.querySelector("label");
    const checkbox = langCheckboxEl.querySelector("input[type=checkbox]");

    checkbox.value = availableLanguages[i];
    checkbox.checked = userInfo.userMediaAndContent.media.languages.includes(availableLanguages[i]);
    label.querySelector(".content-span").textContent = availableLanguages[i];

    checkbox.addEventListener("change", handleLanguageCheckboxChange);
    langCheckboxCon.appendChild(langCheckboxEl);
  }

  // content
  const contentFieldsetsContainer = document.querySelector(".content-fieldsets-container");
  const contentFieldsetTemplate = document.getElementById("content-fieldset-template");
  const userLanguages = userInfo.userMediaAndContent.media.languages;

  for (let i = 0; i < availableLanguages.length; i++) {
    const contentFieldset = contentFieldsetTemplate.content.cloneNode(true);

    contentFieldset.querySelector(".fieldset").classList.add(`${availableLanguages[i]}-content-fieldset`);

    if (!userLanguages.includes(availableLanguages[i])) {
      contentFieldset.querySelector(".fieldset").classList.add("hidden");
    }

    const header = contentFieldset.querySelector(".content-header-section");
    const subHeader = contentFieldset.querySelector(".content-subheader-section");

    header.children[0].children[0].textContent = `(${availableLanguages[i]})`;
    header.children[1].name = header.children[1].name.replace("{{lan}}", availableLanguages[i]);
    header.children[1].textContent = userInfo.userMediaAndContent.content[availableLanguages[i]].header || "";
    subHeader.children[0].children[0].textContent = `(${availableLanguages[i]})`;
    subHeader.children[1].name = subHeader.children[1].name.replace("{{lan}}", availableLanguages[i]);
    subHeader.children[1].textContent = userInfo.userMediaAndContent.content[availableLanguages[i]].sub_header || "";

    contentFieldsetsContainer.appendChild(contentFieldset);
  }
}

// gatherFormData2
const gatherFormData2 = function () {
  const formData = new FormData(document.getElementById("settings-form"));
  const jsonData = {
    username: document.getElementById("username").value,
    password: formData.get("password"),
    phoneNumber: formData.get("phone"),
    email: formData.get("email"),
    businessName: formData.get("businessName"),
    branches: [],
    userMediaAndContent: { content: {}, media: {} },
  };

  const branches = document.querySelectorAll(".branch");

  branches.forEach((branch) => {
    const branchData = {
      name: branch.querySelector('[name="branches.name"]').value,
      phoneNumber: branch.querySelector('[name="branches.phone"]').value,
      country: branch.querySelector('[name="branches.country"]').value,
      city: branch.querySelector('[name="branches.city"]').value,
      district: branch.querySelector('[name="branches.district"]').value,
      neighborhood: branch.querySelector('[name="branches.neighborhood"]').value,
      street: branch.querySelector('[name="branches.street"]').value,
      fulladdress: branch.querySelector('[name="branches.fulladdress"]').value,

      shortestAppointmant: branch.querySelector('[name="branches.shortestAppointmant"]').value,

      weekend: Array.from(branch.querySelectorAll('[name="branches.weekend"]:checked')).map((input) => parseInt(input.value)),
      holidays: Array.from(branch.querySelectorAll('[name="branches.holidays"]')).map((input) => input.value),

      employees: [],
      weekschedule: [],
      breaks: [],
    };

    const employees = branch.querySelectorAll(".employee");

    employees.forEach((employee) => {
      const employeeData = {
        name: employee.querySelector('[name="branches.employees.name"]').value,
        phoneNumber: employee.querySelector('[name="branches.employees.phone"]').value,
        avaliable: employee.querySelector('[name="branches.employees.avaliable"]').checked,
      };
      branchData.employees.push(employeeData);
    });

    const days = branch.querySelectorAll(".aday");
    days.forEach((day) => {
      const dayData = {
        opening: timeToMinutes(day.querySelector('[name="branches.openinghour"]').value),
        closing: timeToMinutes(day.querySelector('[name="branches.closeinghour"]').value),
      };
      branchData.weekschedule.push(dayData);
    });

    const breaks = branch.querySelectorAll(".break");
    breaks.forEach((breakx) => {
      const breakData = {
        start: timeToMinutes(breakx.querySelector('[name="branches.breaks.start"]').value),
        end: timeToMinutes(breakx.querySelector('[name="branches.breaks.end"]').value),
        for: breakx.querySelector('[name="branches.breaks.for"]').value,
      };
      branchData.breaks.push(breakData);
    });

    jsonData.branches.push(branchData);
  });
  // languages
  const langs = Array.from(document.querySelectorAll(".lang-checkbox:checked"));
  jsonData.userMediaAndContent.media.languages = langs.map((lan) => lan.value);

  // content
  const content_con = document.querySelector(".content-fieldsets-container");
  for (let i = 0; i < langs.length; i++) {
    const lan = content_con.querySelector(`.${langs[i].value}-content-fieldset`);
    jsonData.userMediaAndContent.content[langs[i].value] = {};
    const x = jsonData.userMediaAndContent.content[langs[i].value];
    x.header = lan.querySelector(`textarea[name='userMediaAndContent.content.${langs[i].value}.header']`).value;
    x.sub_header = lan.querySelector(`textarea[name='userMediaAndContent.content.${langs[i].value}.sub_header']`).value;
  }

  return jsonData;
};

// Helper function to render additional input fields dynamically
// function render(templateId, target) {
//   const template = document.getElementById(templateId);
//   const clone = document.importNode(template.content, true);
//   target.appendChild(clone);
// }

const send = async function () {
  if (!document.getElementById("password").value) {
    alert("In order to submit changes you should write your password.");
    return;
  }
  try {
    const response = await fetch("/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gatherFormData2()),
    });
  } catch (error) {
    console.error("Error:", error);
  }
};

// Dublicate branch on "branch number" change
document.getElementById("branchesnumber").addEventListener("change", () => {
  let num = parseInt(document.getElementById("branchesnumber").value);
  num = num > 0 ? num : 1;
  const branchfield = document.getElementsByClassName("branch");
  let diff = num - branchfield.length;

  for (; diff > 0; diff--) {
    const el = cloneElement(branchfield[0]);
    el.children[1].children[1].value = "Unnamed Branch";
  }
  for (; diff < 0; diff++) {
    branchfield[branchfield.length - 1].remove();
  }
});

// document.getElementById('holydays').min = new Date(new Date().getFullYear(), 0, 2).toISOString().slice(0, 10);
// document.getElementById('holydays').max = new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10);
const render = function (tempId, container_element) {
  const temp = document.getElementById(tempId);
  container_element.appendChild(temp.content.cloneNode(true));
};

const sellect = (sellector) => {
  return document.querySelector(sellector);
};
function cloneElement(el) {
  const clone = el.parentNode.insertBefore(el.cloneNode(true), el.nextSibling);
  return clone;
}
function duplicateElement(template_selector, parent_element = document) {
  const template = parent_element.querySelector(template_selector);
  if (template) {
    const clone = template.cloneNode(true);
    parent_element.appendChild(clone);
    return clone;
  }
  return null;
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
const sendFile = async function (key, file) {
  const formData = new FormData();
  formData.append(key, file);
  try {
    const response = await fetch("/data/file", {
      method: "POST",
      body: formData,
    });
    return response;
  } catch (err) {
    return alert("Failed to upload image.");
  }
};
const deleteFile = async function (key) {
  if (confirm("You are about to delete this image. Press ok to delete.")) {
    try {
      const response = await fetch(`/data/file/${key}`, {
        method: "DELETE",
      });
      return response;
    } catch (err) {
      return alert("Failed to delete image.");
    }
  }
};

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  const key = e.target.name;

  // validate image
  const acceptAttribute = e.target.getAttribute("accept");
  const allowedTypes = acceptAttribute.split(",").map((item) => item.trim());

  if (!allowedTypes.includes(file.type)) {
    alert("Sorry this file type is not supported");
    e.target.value = ""; // Clear the file input
    return;
  }
  // let img = new Image();
  // img.src = window.URL.createObjectURL(e.target.files[0]);
  // img.onload = () => {
  //   alert(img.width + " " + img.height);
  // };

  // send image
  if (e.target.value) {
    const response = await sendFile(key, file);
    if (response.ok) {
      // update review
      const previewImg = e.target.parentNode.parentNode.parentNode.querySelector(".preview-img");
      previewImg.src = file ? URL.createObjectURL(file) : "";
    }
  }
};

const handleImageDelete = async (el) => {
  // send requist to delete the image. in the server, delete the image and loop over images to rename them.

  const key = el.parentNode.children[0].children[0].name;

  const response = await deleteFile(key);

  if (response.status === 204) {
    // delete the table row
    el.parentNode.parentNode.remove();
    // loop over the rest of images in rename them
    const inputs = document.querySelectorAll('input[type="file"]');
    let c = 0;
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].name === "cover" || inputs[i].name === "logo") continue;
      else if (inputs[i].name.substring(0, 4) === "img-") inputs[i].name = "img-" + c++;
    }
  }
};

const handleAddGallaryImage = () => {
  // Get the template element by ID
  const template = document.getElementById("gallery-img-row-template");

  // Clone the template content
  const newRow = document.importNode(template.content, true);

  // Change the name attribute value
  const input = newRow.querySelector('input[type="file"]');
  input.name = "img-" + (document.querySelectorAll('input[type="file"]').length - 2);

  // Add event listener to input change
  input.addEventListener("change", handleImageChange);

  // Append the new row to your table or container
  const table = document.getElementById("images-table");
  return table.appendChild(newRow);
};

document.querySelectorAll('input[type="file"]').forEach((el) => {
  el.addEventListener("change", handleImageChange);
});

const handleLanguageCheckboxChange = (event) => {
  document.querySelector(`.${event.target.value}-content-fieldset`).classList.toggle("hidden");
};
