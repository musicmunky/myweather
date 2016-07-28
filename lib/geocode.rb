class Geocode

	require 'net/http'
	require 'uri'
	require 'logger'

	@@lookup = {
		"suburb"	=> "neighborhood",
		"localname" => "colloquial_area",
		"city" 		=> "locality",
		"state"		=> "administrative_area_level_1",
		"county"	=> "administrative_area_level_2",
		"district"	=> "administrative_area_level_3",
		"aal4"		=> "administrative_area_level_4",
		"aal5"		=> "administrative_area_level_5",
		"country"	=> "country",
		"zipcode"	=> "postal_code"
	}

	attr_accessor :geocode_data


	def initialize
		self.geocode_data = {}
	end


	def getGeocodeInfo(search)
		begin
			result = {}
			logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))

			logger.tagged("GEOCODE") { logger.debug "Verifying valid search string..." }
			if search.to_s == ""
				raise "Invalid search string"
			end

			logger.tagged("GEOCODE") { logger.debug "Fetching url and api key..." }
			@g = Weather.where(service: "google").first
			url = @g.service_url
			key = @g.apikey
			if url == "" or key == ""
				raise "Invalid parameters set for Geocode object - please check value of Key and Url"
			end

			logger.tagged("GEOCODE") { logger.debug "Building url query string..." }
			search = URI::encode(search)

			logger.tagged("GEOCODE") { logger.debug "Search string is: #{search}" }
			uri = URI("#{url}address=#{search}&key=#{key}")
			response = Net::HTTP.get_response(uri)

			if response.code.to_i == 200
				logger.tagged("GEOCODE") { logger.debug "Request received successfully - building hash response..." }
				respjson = JSON.parse(response.body)
				self.geocode_data = respjson['results']

				if respjson['status'] == "OK"
					locations = {}
					(0..respjson['results'].size - 1).each do |i|
						pid = respjson['results'][i]['place_id']
						locations[pid] = {
							"time_added"		=> Time.now.to_i,
							"active_location"	=> false,
							"latitude"          => getLatLongInformation(i, "lat"),
							"longitude"         => getLatLongInformation(i, "lng"),
							"city"              => getAddressComponents(i, "city"),
							"suburb"            => getAddressComponents(i, "suburb"),
							"state"             => getAddressComponents(i, "state"),
							"zip_code"          => getAddressComponents(i, "zipcode"),
							"country"           => getAddressComponents(i, "country"),
							"place_id"          => getPlaceInformation(i, "place_id"),
							"formatted_address" => getPlaceInformation(i, "formatted_address")
							}
					end

					result['status'] = "success"
					result['count']  = respjson['results'].size
					result['data']   = locations
				else
					logger.tagged("GEOCODE") { logger.debug "Request completed with code #{response.code}, Error: #{respjson['status']} - #{respjson['error_message']}" }
					result['status'] = respjson['status']
					result['error']  = respjson['error_message']
				end
				result['code'] = response.code.to_i
			else
				logger.tagged("GEOCODE") { logger.debug "Request failed with status code #{response.code}, Error: #{response.body}" }
				raise "Error making request: STATUS CODE #{response.code}, ERROR: #{response.body}"
			end
		rescue => error
			result['status']	= "failure"
			result['message']	= "Error: #{error.message}"
			result['content']	= error.backtrace
		ensure
			return result
		end
	end


	def look_up
		@@lookup
	end


	private
		def getLatLongInformation(index, key)
			rval = []
			begin
				kval = key
				data = self.geocode_data[index]
				rval = data['geometry']['location'][kval]
			rescue => error
				rval[0] = "NO_DATA"
				rval[1] = "ERROR: #{error.message}"
			ensure
				return rval
			end
		end


		def getPlaceInformation(index, key)
			rval = []
			begin
				kval = key
				data = self.geocode_data[index]
				rval = data[kval]
			rescue => error
				rval[0] = "NO_DATA"
				rval[1] = "ERROR: #{error.message}"
			ensure
				return rval
			end
		end


		def getAddressComponents(index, key)
			rval = []
			begin
				if @@lookup[key].nil?
					raise "Key not found"
				end
				kval = @@lookup[key]
				data = self.geocode_data[index]
				addr_comps = data['address_components']
				flag = 0
				(0..addr_comps.size - 1).each do |j|
					if addr_comps[j]['types'][0] == kval
						rval = { "long_name" => addr_comps[j]['long_name'], "short_name" => addr_comps[j]['short_name'] }
						flag = 1
						break
					end
				end
				if flag == 0
					rval = { "long_name" => "NO_DATA_FOR_KEY #{kval}", "short_name" => "NO_DATA" }
				end
			rescue => error
				rval[0] = "NO_DATA"
				rval[1] = "ERROR: #{error.message}"
			ensure
				return rval
			end
		end

end