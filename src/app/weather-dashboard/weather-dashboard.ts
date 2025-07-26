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
    {name: 'Colombo' , value: 'colombo'},
    {name: 'Kandy' , value: 'kandy'},
    {name: 'Galle' , value: 'galle'},
    {name: 'Jaffna' , value: 'jaffna'},
    {name: 'Trincomalee' , value: 'trincomalee'},
    {name: 'Anuradhapura' , value: 'anuradhapura'},
    {name: 'Batticaloa' , value: 'batticaloa'},
    {name: 'Matara' , value: 'matara'}
  ]

  selectedCity = 'colombo';
  currentTime = '';
  currentDate = '';

  isLoading = false;
  isError = false;

  forecastData:any
  weatherData:any
  showError = ''
  dailyForecasts:any = [];
  hourlyForecasts:any = [];

  mainTemperature = ''
  mainFeelsLike = ''
  mainCondition = ''
  mainHumidity = ''
  mainWindSpeed = ''
  mainPressure = ''
  mainUV = ''
  sunsetTime = ''
  sunriseTime = ''
  mainWeatherIcon = ''

  private apiKey = environment.apiKey;
  private baseUrl = environment.baseUrl;

  searchControl = new FormControl('');
  filteredCities!: Observable<{name: string, value: string}[]>;

  ngOnInit() {
    this.filteredCities = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );

    // Get Weather Data on init
    this.getWeatherData();
  }

  onCityChange(cityValue: string) {
    console.log("Selected city:", cityValue);
    // Call your weather API or any other function here
    this.getWeatherData()
  }

  async getWeatherData(){
    this.isLoading = true;

    this.setTime();

    try{

      // Fetch current weather data
      // const currentWeatherUrl = `${this.baseUrl}/weather?lat=${city.lat}&lon=${city.lon}&appid=${this.apiKey}&units=metric`;
      const currentWeatherUrl = `${this.baseUrl}/weather?q=${this.selectedCity},LK&appid=${this.apiKey}&units=metric`;
      const currentResponse = await fetch(currentWeatherUrl);

      if (!currentResponse.ok) {
        this.isError = true;
        this.showError = `Failed to fetch weather data`;
        throw new Error(`HTTP error! status: ${currentResponse.status}`);
      }

      this.weatherData = await currentResponse.json();
      this.mainWeatherIcon = this.weatherData.weather[0].icon;

      // Fetch 5-day forecast data
      const forecastUrl = `${this.baseUrl}/forecast?lat=${this.weatherData.coord.lat}&lon=${this.weatherData.coord.lon}&appid=${this.apiKey}&units=metric`;
      const forecastResponse = await fetch(forecastUrl);
       
      if (!forecastResponse.ok) {
        this.isError = true;
        this.showError = `Failed to fetch forecast data`;
        throw new Error(`HTTP error! status: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();
      this.forecastData = forecastData.list;

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
    this.mainTemperature = `${Math.round(this.weatherData.main.temp)}°C`;
    this.mainFeelsLike = `Feels like: ${Math.round(this.weatherData.main.feels_like)}°C`;
    this.mainCondition = this.weatherData.weather[0].description;
    this.mainHumidity = `${this.weatherData.main.humidity}%`;
    this.mainWindSpeed = `${Math.round(this.weatherData.wind.speed * 3.6)}km/h`;
    this.mainPressure = `${this.weatherData.main.pressure}hPa`;
    this.mainUV = this.estimateUVIndex(this.weatherData.weather[0].main); // This is only a estimated value
    

    // Convert sunrise/sunset from Unix timestamp to local time
    this.sunriseTime = new Date(this.weatherData.sys.sunrise * 1000).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Colombo'
    });
    this.sunsetTime = new Date(this.weatherData.sys.sunset * 1000).toLocaleTimeString('en-GB', { 
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

    this.forecastData.forEach((item:any) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!processedDays.has(dayKey) && this.dailyForecasts.length < 5) {
            const hour = date.getHours();
            if (hour >= 11 && hour <= 15) {
                processedDays.add(dayKey);
                this.dailyForecasts.push({
                    day: this.dailyForecasts.length === 0 ? 'Today' : 
                         date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
                    temp: Math.round(item.main.temp),
                    desc: item.weather[0].description,
                    // icon: this.getWeatherIcon(item.weather[0].main, item.weather[0].icon)
                    icon: item.weather[0].icon
                });
            }
        }
    });
  }

  updateHourlyForecast() {

    this.hourlyForecasts = [];

    // Take first 5 hours of forecast
    this.forecastData.slice(0, 5).forEach((item:any) => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Colombo'
        });

        this.hourlyForecasts.push({
          time: time,
          temp: Math.round(item.main.temp),
          speed: Math.round(item.wind.speed * 3.6),
          icon: item.weather[0].icon
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

  estimateUVIndex(weatherMain:any) {
    const uvIndexes:any = {
        'Clear': '8-10',
        'Clouds': '4-6',
        'Rain': '2-4',
        'Thunderstorm': '1-3',
        'Snow': '5-7',
        'Mist': '3-5',
        'Fog': '2-4'
    };
    return uvIndexes[weatherMain] || '5-7';
  }

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
    alert("SEARCH")
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
