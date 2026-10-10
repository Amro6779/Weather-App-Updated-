"use strict";

//////////////////? elements //////////////////////

const loader = document.getElementById("spinner");
const weatherForecast = document.getElementById("weather-forecast");
const currentWeatherInfo = document.getElementById("current-weather-info");
const searchForm = document.querySelector("#search-form");
const searchBtn = document.querySelector(".search-button");
const searchInput = document.querySelector("#search-input");
const switchImperial = document.getElementById("switch-imperial");
const dailyStatus = document.getElementById("daily-data");
const hourlyStatus = document.getElementById("weather-per-hour");
const days = document.getElementById("days");
const dayName = document.getElementById("day-name");
const errorPage = document.getElementById("error-page");
const retryBtn = document.getElementById("retryBtn");

//////////////////todo  variables //////////////////////

const weatherIconMap = {
  0: "icon-sunny.webp",
  1: "icon-sunny.webp",
  2: "icon-partly-cloudy.webp",
  3: "icon-partly-cloudy.webp",
  45: "icon-fog.webp",
  48: "icon-fog.webp",
  51: "icon-drizzle.webp",
  53: "icon-drizzle.webp",
  55: "icon-drizzle.webp",
  56: "icon-drizzle.webp",
  57: "icon-drizzle.webp",
  61: "icon-rain.webp",
  63: "icon-rain.webp",
  65: "icon-rain.webp",
  66: "icon-rain.webp",
  67: "icon-rain.webp",
  71: "icon-snow.webp",
  73: "icon-snow.webp",
  75: "icon-snow.webp",
  77: "icon-snow.webp",
  80: "icon-drizzle.webp",
  81: "icon-drizzle.webp",
  82: "icon-rain.webp",
  85: "icon-snow.webp",
  86: "icon-snow.webp",
  95: "icon-storm.webp",
  96: "icon-storm.webp",
  99: "icon-storm.webp",
};

let currentWeather = {};
let currentDayDate = "";
let dailyForecast = [];
let hourlyForecast = [];
let lastRequest = null;

let weatherUnits = {
  temperature: "celsius",
  windSpeed: "kmh",
  precipitation: "mm",
};

//////////////////! events ////////////////////////

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchForPlace(searchInput.value);
});

days.addEventListener("click", (e) => {
  let button = e.target.closest("li");
  if (!button) return;

  let dayButton = button.dataset.date;
  currentDayDate = dayButton;
  let filteredDays = filterHourlyByDay(hourlyForecast, dayButton);
  displayHourlyWeather(filteredDays);
  dayName.textContent = new Date(dayButton).toLocaleDateString("en-US", {
    weekday: "long",
  });
});

switchImperial.addEventListener("click", (e) => {
  let button = e.target.closest("a");
  if (!button) return;

  if (button.dataset.action === "toggle") {
    if (weatherUnits.temperature === "celsius") {
      weatherUnits.temperature = "fahrenheit";
      weatherUnits.windSpeed = "mph";
      weatherUnits.precipitation = "inches";
      document.getElementById("switch-button").textContent = "switch to metric";
    } else {
      weatherUnits.temperature = "celsius";
      weatherUnits.windSpeed = "kmh";
      weatherUnits.precipitation = "mm";
      document.getElementById("switch-button").textContent =
        "switch to imperial";
    }
  } else if (button.dataset.unitType) {
    if (button.dataset.category === "temperature") {
      weatherUnits.temperature = button.dataset.unitType;
    } else if (button.dataset.category === "wind-speed") {
      weatherUnits.windSpeed = button.dataset.unitType;
    } else if (button.dataset.category === "precipitation") {
      weatherUnits.precipitation = button.dataset.unitType;
    }
  }

  refreshDisplay();
});

retryBtn?.addEventListener("click", () => {
  showData();
  if (typeof lastRequest === "function") {
    lastRequest();
  }
});

//////////////////* functions ///////////////////////

////////////////////todo get data functions ////////////////////////////

(function getPosition() {
  if (navigator.geolocation) {
    lastRequest = function () {
      showData();
      getPosition();
    };
    navigator.geolocation.getCurrentPosition(async (position) => {
      showLoading();
      try {
        let response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
        );
        if(!response.ok){
          throw new Error("failed to fetch user coordinates");
        }
        let placeData = await response.json();
        let country = placeData.address?.country || "";
        let city = placeData.address?.city || placeData.address?.state || "";
        let placeName = `${city} , ${country}`;

        getWeatherStatus(
          position.coords.latitude,
          position.coords.longitude,
          placeName,
        );
      } catch (err) {
        console.warn("Geolocation permission denied or error:", err);
        showError();
      }
    });
  }
})();

async function getWeatherStatus(lat, lng, place) {
  let baseUrl = "https://api.open-meteo.com/v1/forecast";
  let currentParams =
    "current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code";
  let dailyParams = "daily=weather_code,temperature_2m_max,temperature_2m_min";
  let hourlyParams = "hourly=temperature_2m,weather_code";

  let apiUrl = `${baseUrl}?latitude=${lat}&longitude=${lng}&${currentParams}&${dailyParams}&${hourlyParams}`;

  try {
    showLoading();
    let response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }
    let data = await response.json();
    currentWeather = data.current;
    dailyForecast = dailyData(data.daily);
    currentDayDate = dailyForecast[0].date;
    hourlyForecast = hourlyData(data.hourly);
    let filteredHours = filterHourlyByDay(
      hourlyForecast,
      dailyForecast[0].date,
    );
    displayCurrentWeather(currentWeather, place);
    displayDailyWeather(dailyForecast);
    displayHourlyWeather(filteredHours);
    displayDays(dailyForecast);
    dayName.textContent = new Date(dailyForecast[0].date).toLocaleDateString(
      "en-US",
      { weekday: "long" },
    );
    showData();
  } catch (error) {
    showError();
  }
}

function getWeatherIcon(code) {
  return weatherIconMap[code] || "icon-sunny.webp";
}

function dailyData(daily) {
  return daily.time.map((date, index) => {
    return {
      date: date,
      code: daily.weather_code[index],
      max: daily.temperature_2m_max[index],
      min: daily.temperature_2m_min[index],
    };
  });
}

function hourlyData(hourly) {
  return hourly.time.map((date, index) => {
    return {
      date: date,
      code: hourly.weather_code[index],
      temperature: hourly.temperature_2m[index],
    };
  });
}

function filterHourlyByDay(hourlyForecast, day) {
  return hourlyForecast.filter((hour) => {
    return hour.date.startsWith(day);
  });
}

async function searchForPlace(placeName) {
  showLoading();
  lastRequest = function () {
    searchForPlace(placeName);
  };
  try {
    let placeResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${placeName}`,
    );
    if (!placeResponse.ok) {
      throw new Error("failed to fetch place data");     
    }
    let placeData = await placeResponse.json();
    if (!placeData.results || placeData.results.length === 0) {
      document.getElementById("weather-status").classList.add("d-none");
      document.getElementById("empty-state").classList.remove("d-none");
      return;
    }
    document.getElementById("weather-status").classList.remove("d-none");
    document.getElementById("empty-state").classList.add("d-none");

    let place = placeData.results[0];
    let placeInfo = `${place.name} , ${place.country}`;
    getWeatherStatus(place.latitude, place.longitude, placeInfo);
  } catch (error) {
    showError();
  }
}

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function kmhToMph(km) {
  return km * 0.621371;
}

function mmToInches(mm) {
  return mm * 0.0393701;
}

function formatTemp(celsius) {
  let value =
    weatherUnits.temperature === "fahrenheit"
      ? celsiusToFahrenheit(celsius)
      : celsius;
  return value.toFixed(1);
}

function formatWind(kmh) {
  let value = weatherUnits.windSpeed === "mph" ? kmhToMph(kmh) : kmh;
  return value.toFixed(1);
}

function formatPrecipitation(mm) {
  let value = weatherUnits.precipitation === "inches" ? mmToInches(mm) : mm;
  return value.toFixed(2);
}

////////////////////? display data functions ////////////////////////////////
function displayCurrentWeather(current, place) {
  document.getElementById("current-date").textContent =
    `${new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}`;
  document.getElementById("current-icon").src =
    `./images/${getWeatherIcon(current.weather_code)}`;
  document.getElementById("current-degree").textContent = formatTemp(
    current.temperature_2m,
  );
  document.getElementById("city-name").textContent = `${place}`;
  document.getElementById("feels-like").textContent = formatTemp(
    current.apparent_temperature,
  );
  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}`;
  document.getElementById("wind").textContent = formatWind(
    current.wind_speed_10m,
  );
  document.getElementById("precipitation").textContent = formatPrecipitation(
    current.precipitation,
  );
}

function displayDailyWeather(dailyForecast) {
  let cartoona = ``;
  for (let i = 0; i < dailyForecast.length; i++) {
    cartoona += `<div id="week-days" class="tuesday text-center p-2 rounded-3">
                                    <div class="caption">
                                        <p class="text-light">${new Date(dailyForecast[i].date).toLocaleDateString("en-US", { weekday: "short" })}</p>
                                        <img class="w-75" src="./images/${getWeatherIcon(dailyForecast[i].code)}" alt="icon">
                                    </div>
                                    <div class="number d-flex justify-content-between">
                                        <p class="text-light">${formatTemp(dailyForecast[i].max)}&deg;</p>
                                        <p class="text-light">${formatTemp(dailyForecast[i].min)}&deg;</p>
                                    </div>
                                </div>
                                `;
  }

  dailyStatus.innerHTML = cartoona;
}

function displayHourlyWeather(hourlyForecast) {
  let cartoona = ``;

  for (let i = 0; i < hourlyForecast.length; i++) {
    cartoona += `<div class="hourly-status d-flex justify-content-between align-items-center p-2 rounded-3">
                                <div class="caption d-flex align-items-center">
                                    <img src="./images/${getWeatherIcon(hourlyForecast[i].code)}" alt="icon">
                                    <p class="text-light">${new Date(hourlyForecast[i].date).toLocaleTimeString("en-US", { hour: "numeric" })}</p>
                                </div>
                                <div class="number">
                                    <p class="text-light">${formatTemp(hourlyForecast[i].temperature)} &deg;</p>
                                </div>
                            </div>`;
  }

  hourlyStatus.innerHTML = cartoona;
}

function displayDays(day) {
  let cartoona = ``;
  for (let i = 0; i < day.length; i++) {
    cartoona += `<li data-date="${day[i].date}"><button type="button" class="dropdown-item text-light rounded-2 mt-2 w-100 text-start">${new Date(day[i].date).toLocaleDateString("en-US", { weekday: "long" })}</button></li>`;
  }
  days.innerHTML = cartoona;
}

function refreshDisplay() {
  displayCurrentWeather(
    currentWeather,
    document.getElementById("city-name").textContent,
  );
  displayDailyWeather(dailyForecast);
  let filteredHours = filterHourlyByDay(hourlyForecast, currentDayDate);
  displayHourlyWeather(filteredHours);
  updateCheckmarks();
  updateUnitLabels();
}

function updateCheckmarks() {
  let allOptions = document.querySelectorAll("[data-unit-type]");
  allOptions.forEach(function (option) {
    let checkmark = option.querySelector(".checkmark");
    if (!checkmark) return;

    let category = option.dataset.category;
    let unitType = option.dataset.unitType;
    let isSelected =
      (category === "temperature" && weatherUnits.temperature === unitType) ||
      (category === "wind-speed" && weatherUnits.windSpeed === unitType) ||
      (category === "precipitation" && weatherUnits.precipitation === unitType);

    checkmark.classList.toggle("d-none", !isSelected);
  });
}

function updateUnitLabels() {
  document.getElementById("wind-unit").textContent =
    weatherUnits.windSpeed === "mph" ? "mph" : "km/h";
  document.getElementById("precipitation-unit").textContent =
    weatherUnits.precipitation === "inches" ? "in" : "mm";
}

function showLoading() {
  loader?.classList.remove("d-none");
  currentWeatherInfo.classList.add("d-none");
  weatherForecast.classList.remove("d-none");
  errorPage.classList.add("d-none");
}

function showData() {
  loader?.classList.add("d-none");
  currentWeatherInfo.classList.remove("d-none");
  weatherForecast.classList.remove("d-none");
  errorPage.classList.add("d-none");
}

function showError() {
  loader?.classList.add("d-none");
  weatherForecast.classList.add("d-none");
  errorPage.classList.remove("d-none");
}
