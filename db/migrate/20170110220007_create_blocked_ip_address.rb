class CreateBlockedIpAddress < ActiveRecord::Migration
  def change
    create_table :blocked_ip_addresses do |t|
      t.string :ip_address
    end
  end
end
