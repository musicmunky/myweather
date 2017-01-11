class BlockedIps

	require 'logger'

	def self.matches?(request)

		logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))

		@match = false
		@ipaddr = ""
		@ips = BlockedIpAddress.pluck(:ip_address)

		begin
			@ipaddr = request.remote_ip
			if BlockedIpAddress.where(ip_address: @ipaddr).size > 0
				@match = true
				logger.tagged("BLOCKEDIPS") { logger.debug " ---- Blocking request from IP Address #{@ipaddr} ---- " }
			end
		rescue => error
			logger.tagged("BLOCKEDIPS") { logger.debug " ---- Error while attempting to block request from IP Address #{@ipaddr}: #{error.message} ---- " }
			logger.tagged("BLOCKEDIPS") { logger.debug " ---- Backtrace: #{error.backtrace} ---- " }
		end

		return @match
	end

end