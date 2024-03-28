import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from 'pinecone-database';

export class DevMindVectorStore {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private vectorStore?: PineconeStore;

  constructor(apiKey: string, environment: string) {
    this.pinecone = new Pinecone({
      apiKey,
      environment,
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize(indexName: string): Promise<void> {
    const index = this.pinecone.Index(indexName);
    
    this.vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      { pineconeIndex: index }
    );
  }

  async addDocuments(documents: Array<{ content: string; metadata: any }>): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const docs = documents.map(doc => ({
      pageContent: doc.content,
      metadata: doc.metadata,
    }));

    await this.vectorStore.addDocuments(docs);
  }

  async similaritySearch(query: string, k: number = 5): Promise<Array<{ content: string; metadata: any }>> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');  
    }

    const results = await this.vectorStore.similaritySearch(query, k);
    return results.map(result => ({
      content: result.pageContent,
      metadata: result.metadata,
    }));
  }

  async searchCodeSnippets(query: string, language?: string): Promise<Array<{ code: string; file: string; score: number }>> {
    const searchResults = await this.similaritySearch(query);
    
    return searchResults
      .filter(result => !language || result.metadata.language === language)
      .map(result => ({
        code: result.content,
        file: result.metadata.file || 'unknown',
        score: result.metadata.score || 0,
      }));
  }
}