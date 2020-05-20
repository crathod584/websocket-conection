import { Component, OnInit } from '@angular/core';

import WebSocket from '@adonisjs/websocket-client/index';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'websocket-connection';
  webSocket:any;
  selectedItems:any;
  mymap:any;
  allItems:any;
  markers:any = {};
  myIcon;
  dropdownList = [
    {"imei":"357454075121887","itemName":"9728","id":1,"lat":"22.734344","lng":"75.873832"},
    {"imei":"352093081151051","itemName":"4807","id":2,"lat":"22.734344","lng":"75.873832"},
    {"imei":"357454075120749","itemName":"6334","id":3,"lat":"22.734344","lng":"75.873832"},
    {"imei":"356917056656064","itemName":"9852","id":4,"lat":"22.734344","lng":"75.873832"},
    {"imei":"356917057934932","itemName":"9201","id":5,"lat":"22.734344","lng":"75.873832"},
    {"imei":"352093081638719","itemName":"7242","id":6,"lat":"22.734344","lng":"75.873832"},
  ];
  dropdownSettings = { 
        singleSelection: false, 
        text:"Select GPS Devices",
        selectAllText:'Select All',
        enableSearchFilter: false,
        classes:"myclass custom-class"
      };

  ngOnInit(){
    this.myIcon = L.icon({
      iconUrl: 'marker-icon.png',
      iconSize: [15, 15],
      iconAnchor: [20, 40],
      popupAnchor: [0, -60]
    });
    
    this.connect();
    this.initMap();
  }

  private initMap(): void {
    this.mymap = L.map('map', {
      center: [ 21.146633, 79.088860],
      zoom: 5
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  });

                tiles.addTo(this.mymap);
  }


  connect () {
    this.webSocket = WebSocket('ws://iswm-dev.acceldash.com').connect();

    this.webSocket.on('open', () => {
      console.log('Connection initialized')
    });

    this.webSocket.on('close', () => {
      console.log('Connection closed')
    });

    return this;
  }

  subscribe (channel, handler?) {
   
      const result = this.webSocket.subscribe(channel);
      
      result.on('gps_data', data => {
        handler(data)
      });

      result.on('error', (error) => {
        console.error(error)
      });

      result.on('close', (state) => {
        console.info(state.topic+" topic subscription "+state._state)
      });
  }

  handleMessageAdd = (gpsDeviceData) => {
    // console.log(message)
    this.setMarkers([gpsDeviceData]);
  };

  onItemSelect(item:any){    
    this.setMarkers([item]);
    this.subscribe('gps_data:'+item.imei);
  }
  
  OnItemDeSelect(item:any){
    delete this.markers[item.imei];
    this.webSocket.getSubscription('gps_data:'+item.imei).close();
  }
  
  onSelectAll(items: any){
    this.allItems = items;
    for(let i=0; i< items.length; i++){
      this.setMarkers([items[i]]);
      this.subscribe('gps_data:'+items[i].imei);
    }
  }
  
  onDeSelectAll(){
    this.markers = {};
    for(let i=0; i< this.allItems.length; i++){
      this.webSocket.getSubscription('gps_data:'+this.allItems[i].imei).close();
    }
  }

setMarkers(data) {

  data.forEach( (obj) => {

    if (!this.markers.hasOwnProperty(obj.imei)) {

      this.markers[obj.imei] = new L.Marker([obj.lat, obj.lng],{icon:this.myIcon})
                               .addTo(this.mymap)
                               .bindPopup("Speed: <strong>" + obj.speed + "</strong><br />Event Date Time: <strong>" + new Date(obj.datetime).toString().split('GMT')[0] + "</strong>");

      this.markers[obj.imei].previousLatLngs = [];

    } else {
      this.markers[obj.imei] = new L.Marker([obj.lat, obj.lng],{icon:this.myIcon})
                               .addTo(this.mymap)
                               .bindPopup("Speed: <strong>" + obj.speed + "</strong><br />Event Date Time: <strong>" + new Date(obj.datetime).toString().split('GMT')[0] + "</strong>"); 
      this.markers[obj.imei].previousLatLngs.push(this.markers[obj.imei].getLatLng());
      
      this.markers[obj.imei].setLatLng([obj.lat, obj.lng]);
    }
  });
}

}
