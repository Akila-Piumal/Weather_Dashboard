import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { map, Observable, startWith } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { environment } from '../../environment';
import { CapitalizePipe } from "../pipes/capitalize-pipe";

@Component({
  selector: 'app-weather-dashboard',
  imports: [CommonModule, MatSlideToggleModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule, CapitalizePipe],
  templateUrl: './weather-dashboard.html',
  styleUrl: './weather-dashboard.css'
})
export class WeatherDashboard {
  isDarkMode = false;
  searchText = 'Colombo'

  allCities = [
    {name: 'Colombo' , value: 'colombo', lat: 6.9271, lon: 79.8612},
    {name: 'Kandy' , value: 'kandy', lat: 7.2906, lon: 80.6337},
    {name: 'Galle' , value: 'galle', lat: 6.0329, lon: 80.217},
    {name: 'Jaffna' , value: 'jaffna', lat: 9.6615, lon: 80.0255},
    {name: 'Trincomalee' , value: 'trincomalee', lat: 8.5874, lon: 81.2152},
    {name: 'Anuradhapura' , value: 'anuradhapura', lat: 8.3114, lon: 80.4037},
    {name: 'Batticaloa' , value: 'batticaloa', lat: 7.7170, lon: 81.7000},
    {name: 'Matara' , value: 'matara', lat: 5.9549, lon: 80.5550 }
  ]

  selectedCity = this.allCities[0];
  currentTime = '';
  currentDate = '';

  isLoading = false;
  isError = false;

  forecastData:any
  currentWeatherData:any
  hourlyData = [];
  dailyData = [];
  showError = ''
  dailyForecasts:any = [];
  hourlyForecasts:any = [];

  mainTemperature = ''
  mainFeelsLike = ''
  mainCondition = ''
  mainHumidity = ''
  mainWindSpeed = ''
  mainPressure = ''
  mainUV:any
  sunsetTime = ''
  sunriseTime = ''
  mainWeatherIcon = ''

  private apiKey = environment.apiKey;
  private baseUrl = environment.baseUrl;

  rainDrops = Array(6).fill(0);

  ngOnInit() {

    // Get Weather Data on init
    this.getWeatherData();
  }

  // WE CAN GET LAN AND LON FOR FREE ITH THIS. BUT HAVE TO CALL SEPERATE API REQUEST FOR EACH CITY
  async getLatAndLon(){
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${this.searchText},Sri+Lanka&format=json&limit=1`);
    
    const data = await response.json();
    if (data.length > 0) {
      const city = {name: this.searchText , value: this.searchText, lat: data[0].lat, lon: data[0].lon }
      this.selectedCity = city;
      console.log(`${this.searchText}: ${data[0].lat}, ${data[0].lon}`);
      this.getWeatherData();
    }else{
      alert("City name not found.")
    }
  }

  onCityChange(cityValue:any) {
    this.getWeatherData()
  }

  async getWeatherData(){
    this.isLoading = true;

    this.currentWeatherData=[]
    this.dailyForecasts = []
    this.hourlyForecasts = []

    this.setTime();

    try{

      // Fetch current weather data
      // const currentWeatherUrl = `${this.baseUrl}/weather?lat=${city.lat}&lon=${city.lon}&appid=${this.apiKey}&units=metric`;
      // const currentWeatherUrl = `${this.baseUrl}/weather?q=${this.selectedCity},LK&appid=${this.apiKey}&units=metric`;
      const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${this.selectedCity.lat}&lon=${this.selectedCity.lon}&appid=${this.apiKey}&units=metric&exclude=minutely`;
      
      const currentResponse = await fetch(oneCallUrl);

      if (!currentResponse.ok) {
        this.isError = true;
        this.showError = `Failed to fetch weather data`;
        throw new Error(`HTTP error! status: ${currentResponse.status}`);
      }

      const weatherData = await currentResponse.json();

      this.currentWeatherData = weatherData.current;
      this.hourlyData = weatherData.hourly;
      this.dailyData = weatherData.daily;
      
      this.mainWeatherIcon = this.currentWeatherData.weather[0].icon;
      

      // Fetch 5-day forecast data
      // const forecastUrl = `${this.baseUrl}/forecast?lat=${this.weatherData.coord.lat}&lon=${this.weatherData.coord.lon}&appid=${this.apiKey}&units=metric`;
      // const forecastResponse = await fetch(forecastUrl);
       
      // if (!forecastResponse.ok) {
      //   this.isError = true;
      //   this.showError = `Failed to fetch forecast data`;
      //   throw new Error(`HTTP error! status: ${forecastResponse.status}`);
      // }

      // const forecastData = await forecastResponse.json();
      // this.forecastData = forecastData.list;

      this.updateCurrentWeather();
      this.updateDailyForecast();
      this.updateHourlyForecast();

      this.isLoading = false;

    }catch(error:any){
      this.isError = true;
      console.error('Error fetching weather data:', error);
      this.showError = `Failed to load weather data: ${error.message}`;
    }
  }

  updateCurrentWeather() {
    this.mainTemperature = `${Math.round(this.currentWeatherData.temp)}°C`;
    this.mainFeelsLike = `Feels like: ${Math.round(this.currentWeatherData.feels_like)}°C`;
    this.mainCondition = this.currentWeatherData.weather[0].description;
    this.mainHumidity = `${this.currentWeatherData.humidity}%`;
    this.mainWindSpeed = `${Math.round(this.currentWeatherData.wind_speed * 3.6)}km/h`;
    this.mainPressure = `${this.currentWeatherData.pressure}hPa`;
    this.mainUV = Math.round(this.currentWeatherData.uvi || 0);
    

    // Convert sunrise/sunset from Unix timestamp to local time
    this.sunriseTime = new Date(this.currentWeatherData.sunrise * 1000).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Colombo'
    });
    this.sunsetTime = new Date(this.currentWeatherData.sunset * 1000).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Colombo'
    });

    // Update weather icon
    // this.mainWeatherIcon = this.getWeatherIcon(this.weatherData.weather[0].main, this.weatherData.weather[0].icon);
    
  }

  updateDailyForecast() {

    // Group forecast data by day
    this.dailyForecasts = [];
    const processedDays = new Set();

    // One Call API 3.0 provides 8 days of daily forecast (including today)
    this.dailyData.slice(0, 7).forEach((day:any, index) => {
      const date = new Date(day.dt * 1000);
      const dayName = index === 0 ? 'Today' : 
                     index === 1 ? 'Tomorrow' :
                     date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

      this.dailyForecasts.push({
        day: dayName,
        temp: Math.round(day.temp.day),
        icon: day.weather[0].icon,
        summary: day.summary
      });
    });

    // this.dailyData.forEach((item:any) => {
    //     const date = new Date(item.dt * 1000);
    //     const dayKey = date.toDateString();
        
    //     if (!processedDays.has(dayKey) && this.dailyForecasts.length < 5) {
    //         const hour = date.getHours();
    //         if (hour >= 11 && hour <= 15) {
    //             processedDays.add(dayKey);
    //             this.dailyForecasts.push({
    //                 day: this.dailyForecasts.length === 0 ? 'Today' : 
    //                      date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
    //                 temp: Math.round(item.main.temp),
    //                 desc: item.weather[0].description,
    //                 // icon: this.getWeatherIcon(item.weather[0].main, item.weather[0].icon)
    //                 icon: item.weather[0].icon
    //             });
    //         }
    //     }
    // });
  }

  updateHourlyForecast() {

    this.hourlyForecasts = [];

    // Take first 5 hours of forecast
        this.hourlyData.slice(0, 10).forEach((hour:any) => {
        const date = new Date(hour.dt * 1000);
        const time = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Colombo'
        });

        // Calculate wind direction
        const windDirection = this.getWindDirection(hour.wind_deg);

        this.hourlyForecasts.push({
          time: time,
          temp: Math.round(hour.temp),
          speed: Math.round(hour.wind_speed * 3.6),
          icon: hour.weather[0].icon,
          windDirection: windDirection
        });
    });
  }

  setTime(){
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Colombo',
      hour12: false
    });

    this.currentDate = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Colombo'
    });
  }

  getWindDirection(degrees:any) {
    const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  // estimateUVIndex(weatherMain:any) {
  //   const uvIndexes:any = {
  //       'Clear': '8-10',
  //       'Clouds': '4-6',
  //       'Rain': '2-4',
  //       'Thunderstorm': '1-3',
  //       'Snow': '5-7',
  //       'Mist': '3-5',
  //       'Fog': '2-4'
  //   };
  //   return uvIndexes[weatherMain] || '5-7';
  // }

  // getWeatherIcon(weatherMain:any, iconCode:any) {
  //   const iconMap:any = {
  //       'Clear': iconCode.includes('d') ? '☀️' : '🌙',
  //       'Clouds': iconCode.includes('01') ? '⛅' : '☁️',
  //       'Rain': '🌧️',
  //       'Drizzle': '🌦️',
  //       'Thunderstorm': '⛈️',
  //       'Snow': '❄️',
  //       'Mist': '🌫️',
  //       'Fog': '🌫️',
  //       'Haze': '🌫️',
  //       'Smoke': '🌫️'
  //   };
  //   return iconMap[weatherMain] || '🌤️';
  // } 

  private _filter(value: string): {name: string, value: string}[] {
    const filterValue = value.toLowerCase();
    return this.allCities.filter(city => city.name.toLowerCase().includes(filterValue));
  }

  onCitySelected(cityName: string) {
    console.log('Selected city:', cityName);
    // ✅ Do something when city selected
  }

  onSearch(){
    const search = this.searchText.trim().toLowerCase();

    // Find a matching city (case-insensitive)
    const matchedCity = this.allCities.find(city => city.name.toLowerCase() === search);

    if (matchedCity) {
      console.log("Matched city:", matchedCity);
      this.selectedCity = matchedCity;
      this.getWeatherData();
    } else {
      console.log("No match found. Fetching lat/lon from API...");
      this.getLatAndLon(); // Dynamic search
    }
  }

  toggleDarkMode(isDark: boolean) {
    this.isDarkMode = isDark;

    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
