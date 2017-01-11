require 'blocked_ips'

Rails.application.routes.draw do

	constraints(BlockedIps) do
		get 'pages/index' => redirect('/oops')
		get '/' => redirect('/oops')
	end

	get 'pages/index'
	root 'pages#index'

	get 'pages/oops'
	get 'oops' => 'pages#oops'

	resources :pages do
		member do
			get "getForecastSearch"
			get "getForecastLatLong"
		end
	end


	match "*path", to: redirect('/'), via: :all

end
