class Forecast

	require 'net/http'
	require 'uri'
	require 'logger'

	@@validunits = ['auto', 'us', 'si', 'ca', 'uk']

	def self.getForecastData(latitude, longitude, options={})
		begin
			result = {}
			logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))

			options = {units: "us", language: "en", timestamp: "", exclusions: "minutely"}.merge(options)

			logger.tagged("FORECAST") { logger.debug "Checking lat/lng values..." }
			if latitude.to_s == "" or longitude.to_s == ""
				raise "Invalid latitude and longitude values"
			end

			logger.tagged("FORECAST") { logger.debug "Checking for valid units..." }
			if @@validunits.find_index(options[:units]).nil?
				raise "Invalid units specified"
			end

			logger.tagged("FORECAST") { logger.debug "Building URL string for forecast query..." }
			option_str = "";
			option_str += (options[:timestamp].to_s != "") ? ",#{options[:timestamp]}" : ""
			option_str += "?units=#{options[:units]}&lang=#{options[:language]}"
			option_str += (options[:exclusions].to_s != "") ? "&exclude=#{options[:exclusions]}" : "";

			logger.tagged("FORECAST") { logger.debug "Fetching url and api key..." }
			@f = Weather.where(service: "forecast").first
			url = @f.service_url
			key = @f.apikey
			rqs = @f.reqs_per_day

			if url == "" or key == ""
				raise "Invalid parameters set for Geocode object - please check value of Key and Url"
			end

			logger.tagged("FORECAST") { logger.debug "Sending request to Forecast(dot)io..." }
			uri = URI("#{url}#{key}/#{latitude},#{longitude}#{option_str}")
			response = Net::HTTP.get_response(uri)

			if response.code.to_i == 200
				logger.tagged("FORECAST") { logger.debug "Request received successfully - building hash response..." }
				respjson = JSON.parse(response.body)
				headinfo = JSON.parse(response.to_json)

				result['status']    = "success"
				result['num_reqs']  = headinfo['x-forecast-api-calls'][0].to_i
				result['code']      = response.code.to_i
				result['hourly']    = respjson['hourly']['data'][1..12]
				result['daily']     = respjson['daily']['data'][0..5]
				result['current']   = respjson['currently']
				result['timezone']  = respjson['timezone']
				result['tz_offset'] = respjson['offset'] # offset is deprecated, need to update the code to account for this
			else
				logger.tagged("FORECAST") { logger.debug "Request failed with status code #{response.code}, Error: #{response.body}" }
				raise "Error making request: STATUS CODE #{response.code}, ERROR: #{response.body}"
			end
		rescue => error
			result['status']  = "failure"
			result['message'] = "Error: #{error.message}"
			result['content'] = error.backtrace
		ensure
			return result
		end

	end


	def self.valid_units
		@@validunits
	end
end
