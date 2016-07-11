class PagesController < ApplicationController

	require 'forecast'
	require 'geocode'

	def index
	end

	def getForecastSearch
		srch = params[:search]
		unit = params[:units]

		response = {}
		content  = {}
		status   = ""
		message  = ""

		begin
			geocode  = Geocode.new
			geodata  = geocode.getGeocodeInfo(srch)
			if geodata['status'] != "success"
				raise "Error fetching forecast: #{geodata['message']}, Error Backtrace: #{geodata['content']}"
			end

			forecast = {}
			if geodata['count'] == 1
				pid = geodata['data'].keys[0]
				forecast = Forecast.getForecastData(geodata['data'][pid]['latitude'], geodata['data'][pid]['longitude'], {units: unit})
				if forecast['status'] != "success"
					raise "Error fetching forecast: #{forecast['message']}, Error Backtrace: #{forecast['content']}"
				end
			end
			content['geodata'] = geodata
			content['forecast'] = forecast

			response['status'] = "success"
			response['message'] = "Returning forecast data for search #{params[:search]}"
			response['content'] = content
		rescue => error
			response['status'] = "failure"
			response['message'] = "Error: #{error.message}"
			response['content'] = error.backtrace
		ensure
			respond_to do |format|
				format.html { render :json => response.to_json }
			end
		end
	end


	def getForecastLatLong
		unit    = params[:units]
		geoinfo = params[:geoinfo]

		response = {}
		content  = {}
		status   = ""
		message  = ""

		begin
			forecast = Forecast.getForecastData(geoinfo['latitude'], geoinfo['longitude'], {units: unit})

			geodata = {
				"data" => { geoinfo['place_id'] => geoinfo },
				"count" => 1
			}
			content['geodata']  = geodata
			content['forecast'] = forecast

			response['status'] = "success"
			response['message'] = "Returning forecast data for search #{params[:search]}"
			response['content'] = content
		rescue => error
			response['status'] = "failure"
			response['message'] = "Error: #{error.message}"
			response['content'] = error.backtrace
		ensure
			respond_to do |format|
				format.html { render :json => response.to_json }
			end
		end
	end

end
