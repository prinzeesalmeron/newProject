import React, { useState, useEffect } from 'react';
import { Book, Clock, Users, Star, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Course, Article, supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export const Learn = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is real estate tokenization?",
      answer: "Real estate tokenization is the process of converting ownership rights in real estate into digital tokens on a blockchain. This allows for fractional ownership, making real estate investment more accessible."
    },
    {
      question: "How do I receive rental income?",
      answer: "Rental income is automatically distributed to token holders daily based on their ownership percentage. Payments are made in BLOCK directly to your wallet."
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
      const [coursesResponse, articlesResponse] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('articles').select('*').order('published_date', { ascending: false })
      ]);

      if (coursesResponse.error) throw coursesResponse.error;
      if (articlesResponse.error) throw articlesResponse.error;

      setCourses(coursesResponse.data || []);
      setArticles(articlesResponse.data || []);
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredCourse = courses.find(course => course.is_featured);
  const popularCourses = courses.filter(course => !course.is_featured).slice(0, 3);
  const featuredArticles = articles.filter(article => article.is_featured).slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Learn & Grow
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
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
                  <h2 className="text-3xl font-bold mb-4">{featuredCourse.title}</h2>
                  <p className="text-lg mb-6 opacity-90">{featuredCourse.description}</p>
                  
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      <span>{featuredCourse.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      <span>{featuredCourse.students_count.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
                      <span>{featuredCourse.rating} rating</span>
                    </div>
                  </div>

                  <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Start Learning</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">What you'll learn:</h3>
                  <ul className="space-y-2">
                    {featuredCourse.topics.map((topic, index) => (
                      <li key={index} className="flex items-center">
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
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Popular Courses</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All Courses
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative">
                  {course.image_url && (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    {course.difficulty}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {course.duration}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{course.rating}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{course.students_count.toLocaleString()} students</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.topics.slice(0, 3).map((topic, topicIndex) => (
                      <span
                        key={topicIndex}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <Book className="h-4 w-4" />
                    <span>Start Course</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All Articles
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(article.published_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">{article.title}</h3>
                  <p className="text-gray-600 mb-4">{article.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">By {article.author}</span>
                      <span className="text-sm text-gray-500">{article.read_time}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Read More
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
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
                className="bg-gray-50 rounded-lg"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Investing?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of investors already building wealth with fractional real estate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Browse Properties
            </button>
            <button className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
              Join Community
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};