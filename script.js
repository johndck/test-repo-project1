let longitudeDetails;
let latitudeDetails;
let ukPostCode = ``;
let maxSunshineHoursPerYear;
let carbonOffsetFactorKgPerMwh;
let panelNumber;
let yearlyEnergyDcKwh;
let panelCapacity;
let arrayAreaMeters;
let isClicked = false;
let previousScroll = 0;
// hide the nav bar on scroll

window.addEventListener("scroll", function () {
  let currentScroll = window.scrollY;
  let navBarEl = document.querySelector("#topNav");

  if (currentScroll > 20 && currentScroll > previousScroll) {
    navBarEl.style.display = "none";
  } else if (currentScroll < previousScroll) {
    navBarEl.style.display = "";
  }
  previousScroll = currentScroll;
});

// get the lat & long details

const geo_URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${ukPostCode}&key=AIzaSyBSz3w7EQnyHPXu2qDA4hz71uCVntYBug8`;

// bring the postcode input & submit button into dom objects
const userPostcode = document.querySelector(".postcodeCaptureForm");
const submitButton = document.querySelector("#checkPostcode");

// Create the search history - if available - recently searched

const searchHistory = () => {
  // check if there is a history stored

  let checkHistory = JSON.parse(localStorage.getItem("PostcodeSearch"));
  // if it is null, exit the function, as nothing to show
  if (checkHistory == null) {
    return;
  } else {
    // create the recent searches buttons
    // create the recent searches div to hold recent search buttons

    let recentSearchEl = document.createElement("div");
    recentSearchEl.classList.add(
      "d-flex",
      "flex-column",
      "align-items-start",
      "previousSearches",
      "text-white"
    );
    let recentSearchesTitle = document.createElement("h7");
    recentSearchesTitle.textContent = "Recent searches:";
    recentSearchEl.append(recentSearchesTitle);

    // button holder
    let buttonHolderEL = document.createElement("div");
    buttonHolderEL.classList.add("results-form");

    // loop through the saved search to create the buttons, then add them to the buttonHolder element

    for (let i = 0; i < checkHistory.length; i++) {
      let historyButtonEL = document.createElement("button");
      historyButtonEL.textContent = checkHistory[i].postcode;
      historyButtonEL.setAttribute("data-custom", checkHistory[i].postcode);
      historyButtonEL.classList.add("results-btn");
      buttonHolderEL.append(historyButtonEL);
    }

    if (document.querySelector(".previousSearches")) {
      let resultsButtons = document.querySelector(".previousSearches");
      while (resultsButtons.firstChild) {
        resultsButtons.removeChild(resultsButtons.firstChild);
      }

      // Add the title again
      let recentSearchesTitle = document.createElement("h7");
      recentSearchesTitle.textContent = "Recent searches:";
      let clearSearchLink = document.createElement("a");
      clearSearchLink.textContent = "Clear";
      clearSearchLink.setAttribute("href", "#");
      resultsButtons.append(recentSearchesTitle);
      resultsButtons.append(buttonHolderEL);
      resultsButtons.append(clearSearchLink);

      clearSearchLink.addEventListener("click", (evt) => {
        // Clear the recent searches from localStorage
        evt.preventDefault();
        localStorage.removeItem("PostcodeSearch");
        // Remove the recent searches container from the DOM
        resultsButtons.remove();
      });
      return;
    }

    recentSearchEl.append(buttonHolderEL);
    let clearSearchLink = document.createElement("a");
    clearSearchLink.textContent = "Clear";
    //clearSearchLink.classList.add("brandbtn");
    clearSearchLink.setAttribute("href", "#");
    //clearSearchLink.classList.add("link-white");
    recentSearchEl.append(clearSearchLink);
    clearSearchLink.addEventListener("click", (evt) => {
      // Clear the recent searches from localStorage
      evt.preventDefault();
      localStorage.removeItem("PostcodeSearch");
      // Remove the recent searches container from the DOM
      recentSearchEl.textContent = "";
      recentSearchEl.remove();
    });
    let searchFormEL = document.querySelector("#hero-content");
    searchFormEL.appendChild(recentSearchEl);
  }
};

searchHistory();

// function to remove spaces & capitalise postcode
const cleanPostcode = (ukPostCode) => {
  return ukPostCode.replace(/\s/g, "").toUpperCase();
};

// check if previous saved searches - if so add the div to the page

// add the search again to the saved history buttons

submitButton.addEventListener("click", (evt) => {
  evt.preventDefault();

  submitButton.disabled = true;
  setTimeout(() => {
    submitButton.disabled = false;
  }, 1000);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  ukPostCode = userPostcode.value.trim();
  ukPostCode = cleanPostcode(ukPostCode);

  // add in some validation on the input - empty
  if (ukPostCode === "") {
    let failedSearchModal = document.querySelector("#postcodefail");
    let failModalMsg = document.querySelector(".modal-title");
    failModalMsg.textContent = "Sunny search";
    let failModalText = document.querySelector(".modal-body");
    failModalText.textContent = "We need a postcode to search for your home";
    new bootstrap.Modal(failedSearchModal).show();
    return;
  }
  // check if any special characters
  const specialCharacters = /[!@#$%^&*()/,.?":{}|<>]/;
  if (specialCharacters.test(ukPostCode)) {
    let failedSearchModal = document.querySelector("#postcodefail");
    let failModalMsg = document.querySelector(".modal-title");
    failModalMsg.textContent = "Sunny search";
    let failModalText = document.querySelector(".modal-body");
    failModalText.textContent = "We need a valid postcode to search";
    new bootstrap.Modal(failedSearchModal).show();
    userPostcode.value = "";
    return;
  }
  // check if greater than 6 characters

  if (ukPostCode.length < 6) {
    let failedSearchModal = document.querySelector("#postcodefail");
    let failModalMsg = document.querySelector(".modal-title");
    failModalMsg.textContent = "Sunny search";
    let failModalText = document.querySelector(".modal-body");
    failModalText.textContent = "We need a valid postcode to search";
    new bootstrap.Modal(failedSearchModal).show();
    userPostcode.value = "";
    return;
  }

  // check is a result already exists and if so remove it
  const checkResultsEL = document.querySelector(".results");
  if (checkResultsEL) {
    checkResultsEL.remove();
  }

  fetchLocation(ukPostCode);
});

// add the event listener for when there are recent history buttons on the page.
// having to use generic event listener as everything is dynamic.
// so just listening out for click near target area

document.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON" && e.target.closest(".previousSearches")) {
    ukPostCode = e.target.textContent;
    const checkResultsEL = document.querySelector(".results");
    if (checkResultsEL) {
      checkResultsEL.remove();
    }
    fetchLocation(ukPostCode);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

const fetchLocation = (ukPostCode) => {
  fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${ukPostCode}&key=AIzaSyBSz3w7EQnyHPXu2qDA4hz71uCVntYBug8`
  )
    .then((response) => {
      // Error handling
      return response.json();
    })
    .then((data) => {
      if (data.status === "ZERO_RESULTS" || data.status === "INVALID_REQUEST") {
        let failedSearchModal = document.querySelector("#postcodefail");
        new bootstrap.Modal(failedSearchModal).show();

        // Fire modal via Bootstrap
        userPostcode.value = "";
        return;
      } else {
        console.log(data);
      }

      latitudeDetails = data.results[0].geometry.location.lat;
      longitudeDetails = data.results[0].geometry.location.lng;

      console.log(latitudeDetails, longitudeDetails);

      //fetchSolarInfo(latitudeDetails, longitudeDetails);

      fetchSolarInfo2(latitudeDetails, longitudeDetails);

      return [latitudeDetails, longitudeDetails];
    })
    //.catch((error) => error);

    .catch((e) => {
      console.log("problem with the fetch call point 1");
      console.log(e);
    });
};

async function fetchSolarInfo2(lat, lon) {
  try {
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&requiredQuality=MEDIUM&key=AIzaSyBSz3w7EQnyHPXu2qDA4hz71uCVntYBug8`
    );

    console.log(response);

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    panelNumber = data.solarPotential.maxArrayPanelsCount;
    maxSunshineHoursPerYear = data.solarPotential.maxSunshineHoursPerYear;
    carbonOffsetFactorKgPerMwh = data.solarPotential.carbonOffsetFactorKgPerMwh;
    panelCapacity = data.solarPotential.panelCapacityWatts;
    arrayAreaMeters = data.solarPotential.maxArrayAreaMeters2;

    console.log(`Postcode: ${ukPostCode},Panels: ${panelNumber},
    Sunshine: ${maxSunshineHoursPerYear},
    Carbon: ${carbonOffsetFactorKgPerMwh},
    Capacity: ${panelCapacity},
    Space: ${arrayAreaMeters}`);
  } catch (e) {
    console.log("No location details were returned");
    console.log(`Here is the error: ${e}`);

    // create the on-screen message

    const taglineEL = document.querySelector("#tagline");
    const resultsEL = document.createElement("div");
    resultsEL.classList.add("results");
    const resultsTitleEl = document.createElement("h3");
    resultsTitleEl.textContent = `Unfortunately we don't currently have any data for your location in this release.`;
    resultsEL.append(resultsTitleEl);
    taglineEL.after(resultsEL);
    return;

    // show the no possible results display on the page
  }
  const taglineEL = document.querySelector("#tagline");
  const resultsEL = document.createElement("div");
  resultsEL.classList.add("results");

  const resultsTitleEl = document.createElement("h3");
  resultsTitleEl.textContent = `Solar potential for ${ukPostCode}`;

  const maxSunshineHoursEl = document.createElement("p");
  maxSunshineHoursEl.textContent = `Total yearly sunshine hours: ${Math.round(
    maxSunshineHoursPerYear
  )} hrs`;

  const panelNumberEL = document.createElement("p");
  panelNumberEL.textContent = `Estimated panel potential: ${panelNumber}`;

  const availableSpaceEL = document.createElement("p");
  availableSpaceEL.textContent = `Available space for panels: ${Math.round(
    arrayAreaMeters
  )} sqm`;

  const carbonEl = document.createElement("p");
  carbonEl.textContent = `Carbon to be offset: ${Math.round(
    carbonOffsetFactorKgPerMwh
  )}`;

  const dataDivEl = document.createElement("div");
  dataDivEl.append(
    resultsTitleEl,
    panelNumberEL,
    maxSunshineHoursEl,
    availableSpaceEL,
    carbonEl
  );

  resultsEL.append(dataDivEl);
  taglineEL.after(resultsEL);
  userPostcode.value = "";
  savePostcodeSearch(ukPostCode);

  searchHistory();
}

// Adds the postcode into Local Storage.
const savePostcodeSearch = (ukPostCode) => {
  let savedSearches = JSON.parse(localStorage.getItem("PostcodeSearch"));

  if (savedSearches == null) {
    let newPostCodeSearch = JSON.stringify([{ postcode: ukPostCode }]);
    localStorage.setItem("PostcodeSearch", newPostCodeSearch);
    // build search history
  } else {
    for (let i = 0; i < savedSearches.length; i++) {
      let existingSavedPostcode = savedSearches[i].postcode;
      if (existingSavedPostcode === ukPostCode) {
        return;
      }
    }
    newSearchEvent = { postcode: ukPostCode };
    savedSearches.push(newSearchEvent);
    let updateEvents = JSON.stringify(savedSearches);
    localStorage.setItem("PostcodeSearch", updateEvents);
    return;
  }
};
