Rails.application.routes.draw do

	get 'pages/index'
	root 'pages#index'

	resources :pages do
		member do
			get "getForecastSearch"
			get "getForecastLatLong"
		end
	end


	match "*path", to: redirect('/'), via: :all

end
