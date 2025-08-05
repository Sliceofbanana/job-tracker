"use client";

interface AboutPageProps {
  className?: string;
}

export default function AboutPage({ className = "" }: AboutPageProps) {

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Section */}
      <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-800/50 to-blue-800/50 backdrop-blur-md border border-white/20">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-3xl font-bold text-white mb-4">Why We Created This Job Tracker</h1>
        <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
          Born from the frustration of disorganized job searches and missed opportunities, 
          this tracker was designed to solve real problems faced by job seekers everywhere.
        </p>
      </div>

      {/* Problem Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-800/30 to-red-900/30 backdrop-blur-md border border-red-400/30">
          <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-3">
            😤 The Problems We Faced
          </h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📝</span>
              <span><strong>Lost Track of Applications:</strong> Applied to dozens of companies but couldn&apos;t remember which ones or when.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📅</span>
              <span><strong>Missed Interview Dates:</strong> Forgot about scheduled interviews or arrived unprepared.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📊</span>
              <span><strong>No Progress Tracking:</strong> Couldn&apos;t see patterns in rejections or measure application success rates.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">🔄</span>
              <span><strong>Improvised Follow-ups:</strong> Never knew when to follow up or what to say.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📋</span>
              <span><strong>Scattered Information:</strong> Job details spread across emails, notes, and browser bookmarks.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-800/30 to-green-900/30 backdrop-blur-md border border-green-400/30">
          <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-3">
            ✨ Our Solution
          </h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">🎯</span>
              <span><strong>Centralized Tracking:</strong> All your applications in one place with detailed progress tracking.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">🔔</span>
              <span><strong>Smart Notifications:</strong> Never miss an interview or follow-up deadline again.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">📈</span>
              <span><strong>Analytics Dashboard:</strong> Visualize your job search progress and identify improvement areas.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">📅</span>
              <span><strong>Calendar Integration:</strong> See all your interviews and deadlines in an organized calendar view.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">🏷️</span>
              <span><strong>Smart Organization:</strong> Tag, filter, and categorize applications for easy management.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Story Section */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-800/30 to-purple-800/30 backdrop-blur-md border border-blue-400/30">
        <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-3">
          📖 The Story Behind This Tracker
        </h2>
        <div className="text-white/80 space-y-4 leading-relaxed">
          <p>
            Like many job seekers, we started our job search with good intentions. We would apply to companies, 
            save job postings in bookmarks, and jot down notes in random places. But as the applications 
            piled up, chaos ensued.
          </p>
          <p>
            We once showed up to an interview a day late because we confused the dates. Another time, 
            we applied to the same company twice because we lost track of our applications. The final 
            straw was when a recruiter asked about our application timeline, and we had no idea what 
            we had submitted or when.
          </p>
          <p>
            That&apos;s when we realized: <strong className="text-blue-300">job searching isn&apos;t just about finding jobs—it&apos;s about managing a complex process</strong>. 
            This tracker was born from that realization, designed to turn the chaotic job search into 
            an organized, trackable, and ultimately successful journey.
          </p>
          <p className="text-cyan-300 font-semibold">
            💡 Every feature in this tracker solves a real problem we faced during our job search. 
            From drag-and-drop status updates to automated follow-up reminders, it&apos;s built by job seekers, for job seekers.
          </p>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-md border border-purple-400/30">
        <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
          🚀 Key Features That Make a Difference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-bold text-white mb-2">Kanban Board</h3>
            <p className="text-sm text-white/70">Visual progress tracking with drag-and-drop functionality</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-bold text-white mb-2">Calendar View</h3>
            <p className="text-sm text-white/70">See all your interviews and deadlines at a glance</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-bold text-white mb-2">Analytics</h3>
            <p className="text-sm text-white/70">Track success rates and identify improvement areas</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="font-bold text-white mb-2">Smart Notifications</h3>
            <p className="text-sm text-white/70">Automated reminders for interviews and follow-ups</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="font-bold text-white mb-2">Advanced Filtering</h3>
            <p className="text-sm text-white/70">Tag, search, and filter applications effortlessly</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-bold text-white mb-2">Goal Tracking</h3>
            <p className="text-sm text-white/70">Set and achieve your job search milestones</p>
          </div>
        </div>
      </div>

      {/* Note about feedback location */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-orange-800/30 to-yellow-800/30 backdrop-blur-md border border-orange-400/30">
        <h2 className="text-2xl font-bold text-orange-300 mb-4 flex items-center gap-3">
          🐛 Want to Report Bugs or Suggest Features?
        </h2>
        <p className="text-white/80 mb-4">
          We&apos;ve made it easier to share your feedback! You can now find the bug report and feature request form 
          prominently displayed at the top of the main page - no need to scroll down here anymore.
        </p>
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="text-xl">👆</span>
          <span className="font-semibold">Look for the &ldquo;Report Bugs & Suggest Features&rdquo; section above</span>
        </div>
      </div>

      {/* Contact & Social */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/20 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Stay Connected</h2>
        <p className="text-white/60 mb-4">
          Follow our journey and get updates on new features and improvements.
        </p>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 rounded-lg bg-white/10 text-white/70">
            💼 Built with ❤️ for job seekers
          </div>
          <div className="px-4 py-2 rounded-lg bg-white/10 text-white/70">
            🚀 Always improving
          </div>
        </div>
      </div>
    </div>
  );
}
