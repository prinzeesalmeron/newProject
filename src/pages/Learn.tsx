import React, { useState, useEffect } from 'react';
import { Book, Clock, Users, Star, Play, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../lib/auth';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  rating: number;
  students_count: number;
  topics: string[];
  image_url: string | null;
  is_featured: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  read_time: string;
  published_date: string;
  is_featured: boolean;
}

export const Learn = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const faqs = [
    {
      question: "What is real estate tokenization?",
      answer: "Real estate tokenization is the process of converting ownership rights in real estate into digital tokens on a blockchain. This allows for fractional ownership, making real estate investment more accessible."
    },
    {
      question: "How do I receive rental income?",
      answer: "Rental income is automatically distributed to token holders daily based on their ownership percentage. Payments are made in stablecoins or ETH directly to your wallet."
    },
    {
      question: "What are the minimum investment amounts?",
      answer: "You can start investing with as little as $10. Different properties may have different minimum token purchase requirements."
    }
  ];

  useEffect(() => {
    fetchEducationalContent();
  }, []);

  const fetchEducationalContent = async () => {
    try {
      const [coursesResult, articlesResult] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('articles')
          .select('*')
          .order('published_date', { ascending: false })
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (articlesResult.error) throw articlesResult.error;

      setCourses(coursesResult.data || []);
      setArticles(articlesResult.data || []);
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = async (course: Course) => {
    if (!user) {
      addToast({
        type: 'error',
        message: 'Please sign in to start a course'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_courses')
        .upsert({
          user_id: user.id,
          course_id: course.id,
          started_at: new Date().toISOString(),
          progress: 0
        });

      if (error) throw error;

      addToast({
        type: 'success',
        message: `Started course: ${course.title}`
      });

      setSelectedCourse(course);
    } catch (error) {
      console.error('Error starting course:', error);
      addToast({
        type: 'error',
        message: 'Failed to start course. Please try again.'
      });
    }
  };

  const handleReadArticle = (article: Article) => {
    setSelectedArticle(article);
  };

  const featuredCourse = courses.find(course => course.is_featured);
  const popularCourses = courses.filter(course => !course.is_featured);
  const featuredArticles = articles.filter(article => article.is_featured);

  const displayedCourses = showAllCourses ? (featuredCourse ? popularCourses : courses) : (featuredCourse ? popularCourses.slice(0, 6) : courses.slice(0, 6));
  const displayedArticles = showAllArticles ? articles : (featuredArticles.length > 0 ? featuredArticles : articles.slice(0, 2));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Learn & Grow
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Master real estate investing with our comprehensive educational resources, courses, and expert insights.
          </motion.p>
        </div>
      </section>

      {/* Featured Course */}
      {featuredCourse && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 rounded-2xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                FEATURED COURSE
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">{featuredCourse.title}</h2>
                  <p className="text-lg text-white/90 mb-6">{featuredCourse.description}</p>
                  
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-white" />
                      <span className="text-white">{featuredCourse.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-white" />
                      <span className="text-white">{featuredCourse.students_count.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
                      <span className="text-white">{featuredCourse.rating} rating</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartCourse(featuredCourse)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <Play className="h-5 w-5" />
                    <span>Start Learning</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">What you'll learn:</h3>
                  <ul className="space-y-2">
                    {featuredCourse.topics.map((topic, index) => (
                      <li key={index} className="flex items-center text-white">
                        <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
     
      </section>
      )}

      {/* Popular Courses */}
      {courses.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {featuredCourse ? 'Popular Courses' : 'Available Courses'}
              </h2>
              {(featuredCourse ? popularCourses.length : courses.length) > 6 && (
                <button
                  onClick={() => setShowAllCourses(!showAllCourses)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {showAllCourses ? 'Show Less' : 'View All Courses'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative">
                    {course.image_url && (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3 bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {course.difficulty}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      {course.duration}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{course.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{course.rating}</span>
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course.students_count.toLocaleString()} students</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.topics.slice(0, 3).map((topic, topicIndex) => (
                        <span
                          key={topicIndex}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleStartCourse(course)}
                      className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Book className="h-4 w-4" />
                      <span>Start Course</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {courses.length === 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-gray-400 text-8xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No courses available yet</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Educational courses will be added by platform administrators to help you learn about real estate investing and blockchain technology.
            </p>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      {articles.length > 0 ? (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Articles</h2>
              {articles.length > 2 && (
                <button
                  onClick={() => setShowAllArticles(!showAllArticles)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {showAllArticles ? 'Show Less' : 'View All Articles'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {displayedArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(article.published_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{article.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{article.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">By {article.author}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{article.read_time}</span>
                      </div>
                      <button
                        onClick={() => handleReadArticle(article)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1"
                      >
                        <span>Read More</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-gray-400 text-8xl mb-6">📰</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No articles available yet</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Educational articles and market insights will be published by our team to keep you informed about real estate investment trends.
            </p>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get answers to the most common questions about real estate tokenization.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Investing?</h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8">
            Join thousands of investors already building wealth with fractional real estate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-white text-blue-600 dark:text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Properties
            </button>
            <button
              onClick={() => window.open('https://discord.gg/blockprop', '_blank')}
              className="bg-blue-700 dark:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors"
            >
              Join Community
            </button>
          </div>
        </div>
      </section>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCourse(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedCourse.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedCourse.duration}
                    </span>
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                      {selectedCourse.rating}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {selectedCourse.students_count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedCourse.description}</p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What you'll learn:</h3>
                <ul className="space-y-2">
                  {selectedCourse.topics.map((topic, index) => (
                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 text-center">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You've been enrolled in this course! Course content will be available soon.
                </p>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArticle(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      {selectedArticle.category}
                    </span>
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{selectedArticle.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <span>By {selectedArticle.author}</span>
                    <span>•</span>
                    <span>{selectedArticle.read_time}</span>
                    <span>•</span>
                    <span>
                      {new Date(selectedArticle.published_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">{selectedArticle.excerpt}</p>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedArticle.content}</div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};