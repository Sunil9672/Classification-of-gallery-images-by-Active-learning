class JioGPT():
 
	def __new__(kt):

		# Making it singleton class

		if not hasattr(kt, 'sunil'):

			kt.instance = super(JioGPT, kt).__new__(kt)

		return kt.instance
 
	def __init__(self,name="Kunal"):

		self.name = name

		print(self.name)


ref1 = JioGPT()
ref2 = JioGPT()

print(ref1 is ref2)