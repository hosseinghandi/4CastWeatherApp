// in the weather data there are weather codes the keys to
// render the video related to the specifi time and climate
import { weatherCodes } from "./WeatherCodes.js";

//main excecustive block
// global access of the days list for functions
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// getting start  once the page is loaded
initilizingPage();


// helper functions are responsibiel for providing the data for main functions
// while during the rendering the pages are called
// the shorterhand function to get the elements from the DOM
const get = (el) => document.getElementById(el);
// the function search amongst the icons peoper for rendering the page based on the time
const iconselector = (weathercodes, dayOrNight) => {
  return weatherCodedesc[weathercodes][dayOrNight].category;
};
// sun image selector based on the hours
const sunimageselector = (sunSet, sunRise) => {
    const sunSetNum = Number(sunSet.split(":")[0]);
    const sunRiseNum = Number(sunRise.split(":")[0]);
    let normlizedTime;
    // check if it is between the sunrise or sunshine otherwis it is night 
    if (exactTime.time > sunRiseNum && exactTime.time < sunSetNum) {
      normlizedTime =
        (exactTime.time - sunRiseNum) / (sunSetNum - sunRiseNum);
    } else {
      // it is night
      normlizedTime = 1;
    }
    const imageidx = Math.floor(normlizedTime * 4);
    return imageidx;
  };
// comapss maker for the wind data 
const compass = {
  points: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  fromDegreetoPoint(deg) {
    const normalized = ((deg % 360) + 360) % 360;
    const idx = Math.round(normalized / 45) % 8;
    return idx;
  },
};

function now() {
  var now = new Date();
  const today = days[now.getDay()];
  const time = now.getHours();
  return [today, time];
}


function filterTime(timelist) {
  const correctedTime = [];
  timelist.forEach((t) => {
    if (t == "00") {
      correctedTime.push("24");
    } else if (t <= 9) {
      correctedTime.push(t.split("0")[1]);
    } else {
      correctedTime.push(t);
    }
  });
  correctedTime[0] = "now";
  return correctedTime;
}

// the main div will be render just in case of API request in order to not render empty page
const mainEl = get("main");




// save latitude and longitude of the user by trying the vital api requests
// user based data
let lat, lon;
let locationIsAsked = false;
let askedLocationIs;

// foundamental data source
let weatherStorge = {};
let locationDataStorage = {};

// categorizing data source
const exactTime = {
  day: now()[0],
  time: now()[1],
};
let current;
let hourly;
let daily;
let weatherCodedesc = weatherCodes;

// html elements
const videobackgroundEl = get("video-background-wrapper");
const bodyEl = get("body");
// baner section
const locationEl = get("location");
const mainTempEl = get("main-temp");
const highTempEl = get("high-tem");
const lowTempEl = get("low-tem");
const generalWeatherState = get("general-temp-state");

// details section
const uvIndexEl = get("uv-index");
const uvIndicator = get("uv-indicator");
const humidity = get("humidity");
const windArrow = get("wind-compass-arrow");
const windVelocity = get("wind-velocity");
const windGusts = get("wind-gusts");
const windDirection = get("wind-direction");
const visibilityEl = get("visibility");
const pressureEl = get("pressure");
const rainEl = get("rain-chance");
const rainIndicator = get("rain-indicator");
const sunEl = get("sun-diagram");
const sunWrapperEl = get("sunTime-wrapper");

// hourly and weekly weather condition section
const dailyWeatherList = get("hourly-weather-wrapper");
const weeklyWeatherList = get("Weekly-weather-wrapper");

// the arrow elements to improve the ui design and their wrapper 
const arrowHourly = get("scroll-fading-hourly");
const scrollContainerHourly = get("hourly-weather-wrapper");

const arrowWeekly = get("scroll-fading-weekly");
const scrollContainerWeekly = get("Weekly-weather-wrapper");

// the necessity to show them is evalaute by an observer to 
// rsponsivily responde to the user

const observer = new ResizeObserver(() => {
  const hasHorizontalScrollWeekly =
    scrollContainerWeekly.scrollWidth > scrollContainerWeekly.clientWidth;
  arrowWeekly.style.display = hasHorizontalScrollWeekly ? "block" : "none";

  const hasHorizontalScrollHourly =
    scrollContainerHourly.scrollWidth > scrollContainerHourly.clientWidth;
  arrowHourly.style.display = hasHorizontalScrollHourly ? "block" : "none";
});

observer.observe(scrollContainerWeekly);
observer.observe(scrollContainerHourly);

// change the opcity of the arrows when you reach to the end of the div
// scroll event listener
scrollContainerHourly.addEventListener("scroll", () => {
  scrollHandeller(scrollContainerHourly,arrowHourly);
});
scrollContainerWeekly.addEventListener("scroll", () => {
  scrollHandeller(scrollContainerWeekly,arrowWeekly);
});

const scrollHandeller = (scrollEl, arrowEl) => {
  const scrollLeft = scrollEl.scrollLeft;
  const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
  const scrollFraction = scrollLeft / maxScroll;
  return arrowEl.style.opacity = 1 - scrollFraction
};


// user interaction to serach weathe data by city or location
const searchBtnEl = get("searchInput");



// search box event listerner 
searchBtnEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleCitySearch(e.target.value);
    searchBtnEl.blur(); 
  }
});

// handel the event for search box
function handleCitySearch(city) {
  locationIsAsked = true;
  askedLocationIs = city;
  searchBtnEl.value = "";
  fetchDataByCity(city);
};

const homePage = get("logo-icon-src")
homePage.addEventListener("click", (e) => {
    locationIsAsked = false;
    initilizingPage();
});



// main block of the code

async function initilizingPage() {
  try {
    // start by taking location data from the user if premitted otherwise the user will be informed
    const pos = await getLocation();
    lat = pos.latitude.toFixed(2);
    lon = pos.longitude.toFixed(2);
    // once you get the latitude and longitude callback 
    // the functions to get weather data and location specification accordingly.
    if (lat && lon) {
      weatherStorge = await getWeatherData(lat, lon);
      locationDataStorage = await gettingLocationData(locationIsAsked);

      // categorize the data for simple data access
      current = weatherStorge.current;
      hourly = weatherStorge.hourly;
      daily = weatherStorge.daily;
    } else {
        throw new Error("Getting the location went wrong");
    };

    // if the data is accessibile properly, call to render the page and show the header and main 
    // otherwise inform the user
    if (weatherStorge && locationDataStorage) {
      renderDataProvision();
      get("header-wrapper").style.display = "flex";
      mainEl.style.display = "block";
    } else {
      throw `An issue occurred while verifying the user's location. 
          This may happen if the user has not granted the browser 
          permission to access location data.`;
    };
  } catch (err) {
    // if the problem is related to the fetching,, inform user that the server might not responding
    if (String(err).includes("fetch")) {
      err = `There was a problem receiving a response from the server. 
      This may occur if the user has not granted proper access to their 
      location. Please ensure that location permissions for this page are 
      enabled.`;
    }
    // render the error on the page to inform the user
    mainEl.innerHTML = "";
    mainEl.style.display = "block";
    mainEl.innerHTML = `
    <div id="errorholder">
    <div class="exclamation-wrapper">
      <i class="fa-solid fa-exclamation"></i>
    </div>
    <p id="errortext">${err}</p>
    </div>
    `;
  };
};

// if the user asked about a city, restart the process respect to the name of entered city
async function fetchDataByCity() {
  try {
    locationDataStorage = await gettingLocationData(locationIsAsked);
    lat = locationDataStorage.lat;
    lon = locationDataStorage.lon;
    // if geolocation have fulfilled the promise, getting new data
    if(lat && lon ) {
      weatherStorge = await getWeatherData(lat, lon);
      current = weatherStorge.current;
      hourly = weatherStorge.hourly;
      daily = weatherStorge.daily;

    }
    else {
      throw new Error("Getting the location went wrong");
    };

    // if the data are provided properly, render them 
    if (weatherStorge && locationDataStorage) {
      // Reset scroll safely using optional chaining
      scrollContainerWeekly && (scrollContainerWeekly.scrollLeft = 0);
      scrollContainerHourly && (scrollContainerHourly.scrollLeft = 0);
      renderDataProvision();
    } else {
      throw new Error(
        "Something went wrong. Please check the location you searched and your permission settings."
      );
    }
  } catch (err) {
    // if soemthing went wrong try to render the user location weather to not shoutdown the page
    // inform to the user that maybe the city that they search does not exist 
    const errorOnCitySearch = get("errorCitySearch");
    errorOnCitySearch.classList.add("active");
    setTimeout(() => {
      errorOnCitySearch.classList.remove("active");
    }, 4000);

    const pos = await getLocation();
    lat = pos.latitude.toFixed(2);
    lon = pos.longitude.toFixed(2);
    if (lat && lon) {
    }
  }
}


// the main elements provider of the site

function renderDataProvision() {
  // take just the first aprt of location which is more percise
  const locationName =
    locationDataStorage.name || locationDataStorage.display_name.split(",")[0];
  const weathercodeOfcurrentTimedesc =
    weatherCodedesc[current.weather_code][current.is_day].description;
  const weathercodeOfcurrentTimedcatgory =
    weatherCodedesc[current.weather_code][current.is_day].category;
  // select the proper video for background based on the time and the weather code
  videobackgroundEl.innerHTML = "";
  locationEl.innerHTML = "";
  mainTempEl.innerHTML = "";

  
  videobackgroundEl.innerHTML = `
     <video autoplay muted loop playsinline preload="metadata" id="backVideo">
        <source 
            id="videoSource"
            loading="lazy"
            aria-hidden="true"
            src="videos/${weathercodeOfcurrentTimedcatgory}.mp4" 
            alt="a video of ${weathercodeOfcurrentTimedcatgory}"
            type="video/mp4">
    </video>
    `;

  // to enhance the feasibility and readibility of the site, in the night
  // which the videos are darker, the text and logos becomes white
  const currentSky = current.is_day;
  adoptingElColorBy(currentSky);

  locationEl.innerHTML = `<img 
                class="loc-icon-s"
                src="icons/detailed/loc-${currentSky ? "b" : "w"}.png" 
                alt=" a location icon">
                <span   class="location" 
                        id="location">${locationName}</span>`;

  mainTempEl.innerHTML = `${current.apparent_temperature.toFixed(0)}<span class="degree">°</span>`;
  highTempEl.innerHTML = `H:<span id="feelslike_temp">${daily.temperature_2m_max[0].toFixed(0)}°</span>`;
  lowTempEl.innerHTML = `L:<span id="feelslike_temp">${daily.temperature_2m_min[0].toFixed(0)}°</span>`;
  generalWeatherState.innerText = weathercodeOfcurrentTimedesc;
  dailyWeatherList.innerHTML = hourlyWeatherRender(hourly);
  uvIndexEl.innerHTML = `<strong class="detail-value">${daily.uv_index_max[0]}</strong>`;
  uvIndicator.style.left = `${daily.uv_index_max[0] * 10}%`;
  humidity.innerHTML = `<strong class="detail-value">${daily.relative_humidity_2m_mean[0]}%</strong>`;
  visibilityEl.innerHTML = `<strong class="detail-value">${(
    daily.visibility_mean[0] / 1000
  ).toFixed()}</strong> km`;

  pressureEl.innerHTML = `<strong class="detail-value">${daily.pressure_msl_mean[0]}</strong> hPa`;
  rainIndicator.style.left = `${daily.precipitation_probability_mean[0]}%`;
  rainEl.innerHTML = `<strong class="detail-value">${daily.precipitation_probability_mean[0]}</strong>%`;
  windRender();
  sunRiseShine();
  weeklyWeatherList.innerHTML = weeklyWeatherRender(daily);
}

function windRender() {
  windArrow.style.setProperty("--angle", `${current.wind_direction_10m}deg`);
  windVelocity.innerHTML = ` <div class="wind-flex">
        <span class="detail-title">Wind</span>
        <span><strong class="detail-value">${current.wind_speed_10m}</strong></span>
    </div>
    `;
  windGusts.innerHTML = ` <div class="wind-flex">
        <span class="detail-title">Gusts</span>
        <span><strong class="detail-value">${current.wind_gusts_10m}</strong></span>
    </div>
    `;

  windDirection.innerHTML = ` <div class="wind-flex">
        <span class="detail-title">Direction</span>
        <span>
        <strong class="detail-value">${
          current.wind_direction_10m +
          "°" +
          " " +
          compass.points[compass.fromDegreetoPoint(current.wind_direction_10m)]
        }</strong>
            </span>
    </div>
    `;
}

function sunRiseShine() {
  const sunRise = daily.sunrise[0].split("T")[1];
  const sunSet = daily.sunset[0].split("T")[1];
  sunWrapperEl.innerHTML = `
    <span id="sunrise">${sunRise} </span>
    <span id="sunshine">${sunSet}</span>
    `;

  sunEl.src = `./icons/sunrise-shine/${sunimageselector(
    sunSet,
    sunRise
  )}.png`;
  sunEl.ariaLabel = `Current sun position at ${exactTime} ${exactTime > 12 ? "PM" : "AM"}`
}

function hourlyWeatherRender(hourly) {
  const take24hValues = (data) => {
    return data.slice(exactTime.time, exactTime.time + 24);
  };
  // use function take 24 h data to render dailt weather data
  const tempDatatime = take24hValues(hourly.time);
  const tempDatacel = take24hValues(hourly.temperature_2m);
  const weathercodes_h = take24hValues(hourly.weather_code);
  const dayOrNight = take24hValues(hourly.is_day);
  const actualhourList = tempDatatime.map((t) => t.split("T")[1].split(":")[0]);

  // this part use a function to delet the etra values which are not necessary for rendering
  // make it more readiable and shorter for saving space 
  const correctedTime =
    actualhourList.length <= 25
      ? filterTime(actualhourList)
      : console.error("the actual hours list returns unexpected list length!");

  // provide data for hourly section 
  let htmlhourly = "";
  for (let onTime = 0; onTime < correctedTime.length; onTime++) {
    let code = iconselector(
          weathercodes_h[onTime],
          dayOrNight[onTime]
        )
    htmlhourly += `
        <div class="weather-item-wrapper">
        <p >${correctedTime[onTime]}</p>
        
        <img    
        id="weather-icon"
        src="icons/weather-cond/${code}.png" 
        alt="an icon of ${code} weather">
        
            <p class="fontb-small-weather-list">${tempDatacel[
              onTime
            ].toFixed()}<span id="temp"></span>°</p>
        </div>
        `;
  }

  return htmlhourly;
}

function weeklyWeatherRender(daily) {

  const todayindx = days.indexOf(exactTime.day);
  const makeListOfDays = (
    days.slice(todayindx, 7) + `,${days.slice(0, todayindx + 1)}`
  ).split(",");

  const dailyweatherlist = daily.temperature_2m_max;
  const WeatherCodes_d = daily.weather_code;
  let htmldaily = "";
  // eliminate one of the day beacuse it is already render for the hourly data
  // for weather code just render the day data, so it is hardcoded as "1" in line 450
  for (let onDay = 0; onDay < makeListOfDays.length - 1; onDay++) {
    let code = iconselector(WeatherCodes_d[onDay],1)
    htmldaily += `
            <div class="weather-item-wrapper">
            <p >${makeListOfDays[onDay].slice(0, 3)}</p>
            <img    
            id="weather-icon"
            src="icons/weather-cond/${code}.png"  
            alt="an icon of ${code} weather">
            
            <p class="fontb-small-weather-list" >${dailyweatherlist[
              onDay
            ].toFixed()}<span></span>°</p>
            </div>
            `;
  }
  return htmldaily;
}


async function gettingLocationData(locationIsAsked) {
  const endpoint = locationIsAsked
    ? `search?format=json&q=${askedLocationIs}&limit=1`
    : `reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

  const responde = await fetch(
    `https://nominatim.openstreetmap.org/${endpoint}`
  );
  const data = await responde.json();
  const dataCorrection = locationIsAsked ? data[0] : data;
  return dataCorrection;
}


function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                "Location access denied. Please allow browser permission to continue."
              )
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get your location timed out."));
            break;
          default:
            reject(
              new Error("An unknown error occurred while retrieving location.")
            );
            break;
        }
      }
    );
  });
}

async function getWeatherData(lat, lon) {
  // needed information for rendering the page 
  // for more readability and clean code store it in endpoint varable
  const endpoint = [
    "&daily=visibility_min,pressure_msl_mean,visibility_mean,precipitation_probability_mean,relative_humidity_2m_mean,weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,rain_sum,showers_sum",
    "snowfall_sum,precipitation_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant",
    "shortwave_radiation_sum",
    "&hourly=weather_code,temperature_2m,is_day",
    "&minutely_15,visibility",
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_gusts_10m,wind_direction_10m,wind_speed_10m",
  ].join(",");

  // take value of lat and lon from global variables
  const locationQuery = `latitude=${lat}&longitude=${lon}`;
  const responde = await fetch(
    `https://api.open-meteo.com/v1/forecast?${locationQuery}${endpoint}`
  );
  const data = await responde.json();
  return data;
}

// adapot the text style  to improve accessbility 
function adoptingElColorBy(currentSky) {
  bodyEl.style.color = `${
    currentSky ? "var(--balckcolor)" : "var(--whitecolor)"
  }`;
  get("logo-icon-src").src = `icons/logo/logo-${
    currentSky ? "black" : "white"
  }.png`;
  get("search-icon-src").src = `icons/navigation/search-${
    currentSky ? "b" : "w"
  }.png`;
  get("searchbox").style.border = `${
    currentSky ? "1px solid var(--balckcolor)" : "1px solid var(--whitecolor)"
  }`;
  get("uv-icon-src").src = `icons/detailed/uv-${currentSky ? "b" : "w"}.png`;
  get("wind-icon-src").src = `icons/detailed/wind-${
    currentSky ? "b" : "w"
  }.png`;
  get("drops-icon-src").src = `icons/detailed/drops-${
    currentSky ? "b" : "w"
  }.png`;
  get("view-icon-src").src = `icons/detailed/view-${
    currentSky ? "b" : "w"
  }.png`;
  get("pressure-icon-src").src = `icons/detailed/pressure-${
    currentSky ? "b" : "w"
  }.png`;
  get("umbrella-icon-src").src = `icons/detailed/umbrella-${
    currentSky ? "b" : "w"
  }.png`;

  document.documentElement.style.setProperty(
    "--balckcolor-mate",
    currentSky ? "#5d5d5d" : "#fff"
  );
  document.querySelectorAll("#section-title").forEach((el) => {
    el.style.borderBottom = `1px solid ${currentSky ? "#282828" : "#fff"}`;
  });
}
