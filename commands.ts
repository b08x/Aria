export interface Command {
  name: string;
  description: string;
  placeholder: string;
}

export const commands: Command[] = [
  { 
    name: '/teach', 
    description: 'Teach me about a specific topic.', 
    placeholder: 'me about the history of the internet...' 
  },
  { 
    name: '/curriculum', 
    description: 'Generate a curriculum for a subject.', 
    placeholder: 'for a 4-week course on React...'
  },
  { 
    name: '/explain', 
    description: 'Explain a concept in simple terms.', 
    placeholder: 'quantum computing like I am 15...'
  },
  { 
    name: '/test', 
    description: 'Test my knowledge on a topic.', 
    placeholder: 'my knowledge on World War II...'
  },
];
