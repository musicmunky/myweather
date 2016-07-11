class CreateWeathers < ActiveRecord::Migration
  def change
    create_table :weathers do |t|
      t.string :apikey
      t.string :service
      t.integer :reqs_per_day
      t.string :service_url

      t.timestamps null: false
    end
  end
end
