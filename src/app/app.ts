import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WeatherDashboard } from "./weather-dashboard/weather-dashboard";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WeatherDashboard],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('weather-dashboard');
}
