"use strict";

//////////////////? elements //////////////////////

const searchForm = document.querySelector("#search-form");
const searchBtn = document.querySelector(".search-button");
const searchInput = document.querySelector("#search-input");
const dailyStatus = document.getElementById("daily-data");
const hourlyStatus = document.getElementById("weather-per-hour");
const days = document.getElementById("days");
const dayName = document.getElementById("day-name");

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
let dailyForecast = [];
let hourlyForecast = [];
//////////////////! events ////////////////////////

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchForPlace(searchInput.value);
});

days.addEventListener("click", (e) => {
  let button = e.target.closest("li");
  if (!button) return;

  let dayButton = button.dataset.date;
  let filteredDays = filterHourlyByDay(hourlyForecast, dayButton);
  displayHourlyWeather(filteredDays);
  dayName.textContent = new Date(dayButton).toLocaleDateString("en-US", {
    weekday: "long",
  });
});

//////////////////* functions ///////////////////////

////////////////////todo get data functions ////////////////////////////

(function getPosition() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        let response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
        );
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
        console.error("Error fetching location data:", err);
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
    let response = await fetch(apiUrl);
    let data = await response.json();
    currentWeather = data.current;
    dailyForecast = dailyData(data.daily);
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
    console.log(data.current);
  } catch (error) {
    console.log(error);
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
  let placeResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${placeName}`,
  );
  let placeData = await placeResponse.json();
  let place = placeData.results[0];
  let placeInfo = `${place.name} , ${place.country}`;
  getWeatherStatus(place.latitude, place.longitude, placeInfo);
}

////////////////////? display data functions ////////////////////////////////

function displayCurrentWeather(current, place) {
  document.getElementById("current-date").textContent =
    `${new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}`;
  document.getElementById("current-icon").src =
    `./images/${getWeatherIcon(current.weather_code)}`;
  document.getElementById("current-degree").textContent =
    `${current.temperature_2m}`;
  document.getElementById("city-name").textContent = `${place}`;
  document.getElementById("feels-like").textContent =
    `${current.apparent_temperature}`;
  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}`;
  document.getElementById("wind").textContent = `${current.wind_speed_10m}`;
  document.getElementById("precipitation").textContent =
    `${current.precipitation}`;
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
                                        <p class="text-light">${dailyForecast[i].max}&deg;</p>
                                        <p class="text-light">${dailyForecast[i].min}&deg;</p>
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
                                    <p class="text-light">${hourlyForecast[i].temperature} &deg;</p>
                                </div>
                            </div>`;
  }

  hourlyStatus.innerHTML = cartoona;
}

function displayDays(day) {
  let cartoona = ``;
  for (let i = 0; i < day.length; i++) {
    cartoona += `<li data-date="${day[i].date}"><a class="dropdown-item text-light rounded-2 mt-2">${new Date(day[i].date).toLocaleDateString("en-US", { weekday: "long" })}</a></li>`;
  }

  days.innerHTML = cartoona;
}
