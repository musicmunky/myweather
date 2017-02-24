class Users::PasswordsController < Devise::PasswordsController
  # GET /resource/password/new
  def new
  #   super
    respond_to do |format|
        format.html { redirect_to oops_url }
    end
  end

  # POST /resource/password
  def create
  #   super
    respond_to do |format|
        format.html { redirect_to oops_url }
    end
  end

  # GET /resource/password/edit?reset_password_token=abcdef
  def edit
  #   super
    respond_to do |format|
        format.html { redirect_to oops_url }
    end
  end

  # PUT /resource/password
  def update
  #   super
    respond_to do |format|
        format.html { redirect_to oops_url }
    end
  end

  # protected

  # def after_resetting_password_path_for(resource)
  #   super(resource)
  # end

  # The path used after sending reset password instructions
  # def after_sending_reset_password_instructions_path_for(resource_name)
  #   super(resource_name)
  # end
end
