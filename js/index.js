"use Strict";

//////////////////? elements //////////////////////

const searchForm = document.querySelector("#search-form");
const searchBtn = document.querySelector(".search-button");
const searchInput = document.querySelector("#search-input");
const dailyStatus = document.getElementById("daily-data");

//////////////////todo  variables /////////////////

let coordinates = [];

//////////////////! events ////////////////////////

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
});

//////////////////* functions ///////////////////////

(function getPosition() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      coordinates.push(position.coords.latitude);
      coordinates.push(position.coords.longitude);

      getWeatherStatus(coordinates[0], coordinates[1]);
    });
  }
})();

async function getWeatherStatus(lat, lng) {
  let baseUrl = "https://api.open-meteo.com/v1/forecast";
  let currentParams =
    "current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code";
  let dailyParams = "daily=weather_code,temperature_2m_max,temperature_2m_min";
  let hourlyParams = "hourly=temperature_2m,weather_code";

  let apiUrl = `${baseUrl}?latitude=${lat}&longitude=${lng}&${currentParams}&${dailyParams}&${hourlyParams}`;

  try {
    let response = await fetch(apiUrl);
    let data = await response.json();
    let dailyForecast = dailyData(data.daily);
    let hourlyForeCast = hourlyData(data.hourly);
    displayDailyWeather(dailyForecast);
  } catch (error) {
    console.log(error);
  }
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

function displayDailyWeather(dailyForecast) {
  let cartoona = ``;
  for (let i = 0; i < dailyForecast.length; i++) {
    cartoona += `<div id="week-days" class="tuesday text-center p-2 rounded-3">
                                    <div class="caption">
                                        <p class="text-light">${new Date(dailyForecast[i].date).toLocaleDateString("en-US", { weekday: "short" })}</p>
                                        <img class="w-75" src="./images/icon-rain.webp" alt="icon">
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
