#pragma strict

public enum GA_FITNESS_MODE {
	STRICT = 0,
	LAZY = 1
};
public var ga_FitnessMode : int = parseInt(GA_FITNESS_MODE.STRICT);
public var population : Population;

/* This is a set of chromosomes, and this is sorted (chromosomes with higher fitness
is the firsts, chromosomes with lower fitness is the lasts. */
public class Population	{
	private var chromosomes : Chromosome[];
	private var currentChromosome : int;
	public var currentPopulation : int;
	/* keep track of best fitness and population in which it is found */
	public var bestFitness : int;
	public var bestPopulation : int;
	
	/* Create a population of cCount chromosomes, each one with wCount elements (weights). */
	function Population(cCount : int, wCount : int)	{
		this.chromosomes = new Chromosome[cCount];
		
		for(chromosome in this.chromosomes) {
			chromosome = new Chromosome(wCount);
		}
		
		this.currentPopulation = 0;
		this.currentChromosome = 0;
		this.bestFitness = 0;
		this.bestPopulation = 0;
	}
	
	/* save current population to a binary object */
	function save() : byte[]
	{
		var formatter = new System.Runtime.Serialization.Formatters.Binary.BinaryFormatter();
		var mem = new System.IO.MemoryStream();
		formatter.Serialize(mem, this);
		return mem.GetBuffer();
	}
	
	/* Create a new population according to the fitness of the old chromosomes. */
	function NewGeneration() {
		this.currentPopulation = this.currentPopulation +1;
		this.ResetCurrentChromosome();
		var newChromosomes : Chromosome[] = new Chromosome[this.chromosomes.length];
		var crossOverProb : float = 0.85f;
		for(var i = 0; i < chromosomes.length; i=i+2)
		{
			var firstChrom = this.RouletteWheel();
			var secChrom = this.RouletteWheel();
			
			// do a crossover with probability 85%
			if(Random.value <= crossOverProb) {
				var chromosomePair : Chromosome[] = this.CrossOver(firstChrom, secChrom);
				newChromosomes[i] = chromosomePair[0];
				newChromosomes[i+1] = chromosomePair[1];
				Debug.Log ("Crossover!");
			} else {
				// if not crossover, just copy the 2 chromosomes taken with the Roulette Wheel method
				newChromosomes[i] = firstChrom;
				newChromosomes[i+1] = secChrom;
			}
			
			// in both cases, try a mutation of each chromosome's weights with 0.8% of probability
			newChromosomes[i] = this.Mutate(newChromosomes[i]);
			newChromosomes[i+1] = this.Mutate(newChromosomes[i+1]);
		}
		
		this.chromosomes = newChromosomes;
	}
	
	function GetChromosomes() : Chromosome[] {
		return this.chromosomes;
	}
	
	function GetCurrentChromosome() : Chromosome {
		return this.chromosomes[this.currentChromosome];
	}
	
	function GetCurrentChromosomeID() : int {
		return this.currentChromosome;
	}
	
	function IsLastChromosome() : boolean {
		return (this.currentChromosome == this.chromosomes.length);
	}
	
	function ResetCurrentChromosome() {
		this.currentChromosome = 0;
	}
	
	function SetNextChromosome() {
		this.currentChromosome ++;
	}
	
	function GetCurrentCromosomeFitness() : int {
		return this.chromosomes[this.currentChromosome].GetFitness();
	}
	
	function ResetCurrentCromosomeFitness() {
		this.chromosomes[this.currentChromosome].SetFitness(0);
	}
	
	function SetCurrentCromosomeFitness(fit : int) {
		this.chromosomes[this.currentChromosome].SetFitness(fit);
		if (fit > this.bestFitness)	{
			this.bestFitness = fit;
			this.bestPopulation = this.currentPopulation;
		}
	}
	
	/* Creates 2 new chromosomes by crossovering 2 input chromosomes */
	function CrossOver(firstChrom : Chromosome, secChrom : Chromosome): Chromosome[] {
		var totWeights : int = firstChrom.GetWeights().length;
		var crossingPoint : int = Random.Range(0, totWeights - 2);
		
		// create two chromosomes starting from inputs
		var newChromosome1 = new Chromosome(firstChrom.GetWeights());
		var newChromosome2 = new Chromosome(secChrom.GetWeights());
		
		// crossover on weights
		var weights1 : float[] = new float[totWeights];
		var weights2 : float[] = new float[totWeights];
		for (var i = 0; i < totWeights; i++)	{
			if (i <= crossingPoint)	{
				weights1[i] = newChromosome1.GetWeights()[i];
				weights2[i] = newChromosome2.GetWeights()[i];
			}	else {
				weights1[i] = newChromosome2.GetWeights()[i];
				weights2[i] = newChromosome1.GetWeights()[i];
			}
		}
		
		var chromPair : Chromosome[] = new Chromosome[2];
		chromPair[0] = new Chromosome(weights1);
		chromPair[1] = new Chromosome(weights2);
		
		return chromPair;
	}
		
	/*	"Roulette Wheel" is a method to extract a chromosome by looking at its fitness value:
		if some chromosome's fitness is higher than another, then that chromosome has more 
		possibilities to be taken.
		- [Sum] Calculate sum of all chromosome fitnesses in population -> S.
	    - [Select] Generate random number from interval (0,S) -> r.
	    - [Loop] Go through the population and sum fitnesses from 0 to S -> s. 
	    When the sum s is greater than r, stop and return the chromosome where you are. */
	private function RouletteWheel() : Chromosome {
		var fitnessSum : int = 0;
		var randomNum : int;
		var selectedChrom : int = 0;
		
		for(chromosome in this.chromosomes) {
			fitnessSum += chromosome.GetFitness();
		}
		
		randomNum = Mathf.RoundToInt(Random.Range(0, fitnessSum));
		fitnessSum = 0;
		for(chromosome in this.chromosomes) {
			fitnessSum += chromosome.GetFitness();
			if (fitnessSum > randomNum) {
				break;
			}
			else {
				selectedChrom++;
			}
		}
		Debug.Log("Roulette Wheel chosen #" + selectedChrom);
		return this.chromosomes[selectedChrom];
	}
	
	/* Perform a random mutation of a chromosome. */
	function Mutate(chromosome : Chromosome) : Chromosome	{
		var mutationProb : float = 0.008f; // each weight has a low probability to be mutated		
		for (weight in chromosome.GetWeights()) {
			if (Random.value <= mutationProb) {
				weight += Random.Range(-0.1, 0.1);
				Debug.Log ("Weight mutated!");
			}
		}
		
		return chromosome;
	}

	/* 	This element is an array of weights of the neural network.
		Adjusting weights means adjusting the output of the NN */
	public class Chromosome	{
		private var fitness : int;
		private var weights : float[];
		
		function Chromosome(wCount : int) {
			this.fitness = 0;
			this.weights = new float[wCount];
			for (weight in this.weights) {
				weight = Random.Range(-1.0, 1.0);
			}
		}
		
		function Chromosome(weights : float[]) {
			this.fitness = 0;
			this.weights = weights;
		}
		
		/* 
		This function return the fitness of a chromosome.
		Higher fitness means highest probability to be selected for crossover.
		*/
		public function SetFitness(f : int) {
			this.fitness = f;
		}
		public function GetFitness() : int {
			return this.fitness;
		}
		
		public function SetWeights(w : float[]) {
			this.weights = w;
		}
		public function GetWeights() : float[] {
			return this.weights;
		}
	}
}

/*
Initializes the algorithm.
*/
function Start () {}

function Update () {}