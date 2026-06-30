import React from 'react';
import { ExternalLink } from 'lucide-react';

interface ArticleProps {
  article: {
    title: string;
    description: string;
    source: { name: string };
    urlToImage: string;
    url: string;
  }
}

export const NewsFeed: React.FC<{ articles: ArticleProps['article'][] }> = ({ articles }) => {
  return (
    <div className="flex flex-col gap-4">
      {articles.map((article, idx) => (
        <div key={idx} className="group flex flex-col sm:flex-row gap-4 bg-dark-card/30 backdrop-blur-md border border-dark-border rounded-xl overflow-hidden hover:border-brand-gold/40 transition-colors">
          <div className="sm:w-48 h-32 overflow-hidden shrink-0">
            <img 
              src={article.urlToImage} 
              alt={article.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-4 flex flex-col justify-between flex-1">
            <div>
              <span className="text-xs font-semibold text-brand-goldLight mb-1 block uppercase tracking-wider">{article.source.name}</span>
              <h3 className="text-base font-bold text-white mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-sm text-dark-muted line-clamp-2">{article.description}</p>
            </div>
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="self-start mt-3 flex items-center gap-1.5 text-xs font-semibold text-dark-text hover:text-brand-goldLight transition-colors"
            >
              Read More <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};
