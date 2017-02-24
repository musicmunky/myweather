class PagesController < ApplicationController

#	before_action :authenticate_user!

	require 'forecast'
	require 'geocode'

	def index
        Rails.logger.debug("\n ---- Originating IP Address of Request is #{@ipaddr} ---- \n")

		if current_user.nil?
			respond_to do |format|
				format.html { redirect_to oops_url }
			end
        else
            Rails.logger.debug("\n ---- CURRENT USER is #{current_user.id} ---- \n")

            @ipaddr = ""
            begin
                @ipaddr = request.remote_ip
            rescue
                @ipaddr = "error determining remote ip address"
                ensure
                Rails.logger.debug("\n ---- Originating IP Address of Request is #{@ipaddr} ---- \n")
            end
        end

	end

	def getForecastSearch

		if current_user.nil?
			respond_to do |format|
				format.html { redirect_to oops_url }
			end
        end

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

		if current_user.nil?
			respond_to do |format|
				format.html { redirect_to oops_url }
			end
        end

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
