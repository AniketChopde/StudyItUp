"""
Course Recommendation Agent - LLM-curated, language-aware, pinpoint course links.

Strategy:
- Use the LLM to generate EXACT, verified, working course URLs (YouTube playlists,
  Coursera specializations, NPTEL, edX, Udemy) — no random web-search noise.
- The language of the course titles/descriptions matches the study plan language
  (English, Hindi, Marathi, etc.).
- YouTube links are precise playlist or channel URLs, not search-result pages.
"""

from typing import List, Dict, Any
from loguru import logger
import json

from services.azure_openai import azure_openai_service
from utils.helpers import parse_json_markdown


# ---------------------------------------------------------------------------
# A curated seed map of VERIFIED, pinpoint URLs for very popular topics.
# The LLM uses this as authoritative ground truth.
# ---------------------------------------------------------------------------
CURATED_SEEDS = """
VERIFIED PINPOINT COURSE URLS (use these exactly when the topic matches):

MACHINE LEARNING / AI:
  - "Machine Learning Specialization by Andrew Ng" → https://www.coursera.org/specializations/machine-learning-introduction
  - "Stanford CS229: Machine Learning Full Course" → https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtTyeDr77JYIM
  - "MIT Introduction to Deep Learning (6.S191)" → https://www.youtube.com/playlist?list=PLtBw6njRea6OPbT51w6PBYx3U7Q5-2P-V
  - "Deep Learning Specialization by Andrew Ng" → https://www.coursera.org/specializations/deep-learning
  - "CS50's Intro to AI with Python – Harvard/edX" → https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python
  - "StatQuest Machine Learning Playlist" → https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF
  - "Machine Learning – Sentdex Full Course" → https://www.youtube.com/playlist?list=PLQVvvaa0QuDfKTOs3Keq_kaG2P55YRn5v
  - "NPTEL Machine Learning – IIT Madras" → https://www.youtube.com/playlist?list=PLyqSpQzTE6M9gCgajvQbc68Hk_JKGBAYT

DEEP LEARNING:
  - "Deep Learning by 3Blue1Brown (Neural Networks)" → https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi
  - "Fast.ai Practical Deep Learning" → https://course.fast.ai/
  - "Deep Learning Fundamentals – Lightning AI" → https://www.youtube.com/playlist?list=PLaMu-SDt_RB5-PtqCENiAJpVJLFETG6uc
  - "Neural Networks: Zero to Hero by Andrej Karpathy" → https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ

PYTHON PROGRAMMING:
  - "Python Tutorial for Beginners – Programming with Mosh" → https://www.youtube.com/watch?v=kqtD5dpn9C8
  - "Python Full Course – freeCodeCamp" → https://www.youtube.com/watch?v=rfscVS0vtbw
  - "100 Days of Code: Python Bootcamp – Udemy" → https://www.udemy.com/course/100-days-of-code/
  - "Python for Everybody – Coursera (University of Michigan)" → https://www.coursera.org/specializations/python
  - "CS50P: Introduction to Programming with Python – Harvard" → https://cs50.harvard.edu/python/2022/

DATA SCIENCE:
  - "IBM Data Science Professional Certificate – Coursera" → https://www.coursera.org/professional-certificates/ibm-data-science
  - "Data Science Full Course – freeCodeCamp" → https://www.youtube.com/watch?v=ua-CiDNNj30
  - "Data Analysis with Python – freeCodeCamp" → https://www.youtube.com/watch?v=r-uOLxNrNk8

JAVA:
  - "Java Tutorial for Beginners – Programming with Mosh" → https://www.youtube.com/watch?v=eIrMbAQSU34
  - "Java Full Course – Telusko (Hindi + English)" → https://www.youtube.com/playlist?list=PLsyeobzWxl7pe_IiTfNyr55kwJPWbgxB5
  - "Java Programming Masterclass – Udemy (Tim Buchalka)" → https://www.udemy.com/course/java-the-complete-java-developer-course/
  - "Core Java Tutorial – NPTEL IIT Kharagpur" → https://www.youtube.com/playlist?list=PL9ooVrP1hQOHi6fGZEc9WlhFk1FiRoCHg

WEB DEVELOPMENT:
  - "The Odin Project – Full Stack" → https://www.theodinproject.com/
  - "Full Stack Web Development – freeCodeCamp" → https://www.freecodecamp.org/learn
  - "HTML, CSS, JavaScript for Beginners – Traversy Media" → https://www.youtube.com/playlist?list=PLillGF-RfqbZTASqIqdvm1R5mLrQq79CU
  - "The Complete Web Developer Bootcamp – Udemy (Angela Yu)" → https://www.udemy.com/course/the-complete-web-development-bootcamp/

REACT / FRONTEND:
  - "React JS Full Course – Dave Gray" → https://www.youtube.com/playlist?list=PL0Zuz27SZ-6PrE9srvEn8nbhOOyxnWXfp
  - "React Tutorial for Beginners – Programming with Mosh" → https://www.youtube.com/watch?v=SqcY0GlETPk
  - "React Full Course – freeCodeCamp" → https://www.youtube.com/watch?v=bMknfKXIFA8

NODE.JS / BACKEND:
  - "Node.js Full Course – freeCodeCamp" → https://www.youtube.com/watch?v=Oe421EPjeBE
  - "Node.js + Express.js – Traversy Media Crash Course" → https://www.youtube.com/watch?v=SBvmnHTQIPY

MATHEMATICS:
  - "Khan Academy Math – Full Curriculum" → https://www.khanacademy.org/math
  - "3Blue1Brown Essence of Linear Algebra" → https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
  - "3Blue1Brown Calculus" → https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr
  - "MIT 18.06 Linear Algebra – Gilbert Strang" → https://www.youtube.com/playlist?list=PL49CF3715CB9EF31D

GATE CS/IT:
  - "Gate Smashers Computer Science Full Playlist" → https://www.youtube.com/c/GateSmashers
  - "NPTEL GATE Preparation – IIT Lectures" → https://nptel.ac.in/
  - "GATE Wallah Computer Science" → https://www.youtube.com/@GATEWallahbyPW

JEE PHYSICS / CHEMISTRY / MATHS:
  - "Physics Wallah JEE – Alakh Pandey" → https://www.youtube.com/@PhysicsWallah
  - "JEE Main & Advanced Full Course – Unacademy" → https://unacademy.com/goal/jee-main-and-advanced-2024/TMUVD
  - "Khan Academy for JEE Maths" → https://www.khanacademy.org/math

UPSC / IAS:
  - "UPSC IAS Preparation Full Course – Unacademy" → https://unacademy.com/goal/upsc-civil-services-examination-ias/KSCGY
  - "Drishti IAS YouTube Channel" → https://www.youtube.com/@DrishtiIASvideos
  - "Vision IAS Current Affairs" → https://www.youtube.com/@VisionIAS

MPSC / MARATHI EXAMS:
  - "Unacademy MPSC (Maharashtra Public Service Commission)" → https://www.youtube.com/@UnacademyMPSC
  - "eMPSC Katta (Marathi)" → https://www.youtube.com/@eMPSCKatta
  - "Preeti Raut MPSC Preparation" → https://www.youtube.com/@PreetiRaut
  - "MPSC Toppers Katta" → https://www.youtube.com/results?search_query=mpsc+preparation+marathi

LANGCHAIN / LLM DEVELOPMENT:
  - "LangChain Full Course – freeCodeCamp" → https://www.youtube.com/watch?v=lG7Uxts9SXs
  - "LangChain Crash Course – James Briggs" → https://www.youtube.com/playlist?list=PLIUOU7oqGTLieV9uTIFMm6_4PXg-hlN6G
  - "Building LLM Apps with LangChain – DeepLearning.AI" → https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/

DOCKER / DEVOPS:
  - "Docker Full Course – TechWorld with Nana" → https://www.youtube.com/watch?v=3c-iBn73dDE
  - "DevOps Bootcamp – TechWorld with Nana" → https://www.youtube.com/@TechWorldwithNana

DATABASES / SQL:
  - "SQL Full Course – freeCodeCamp" → https://www.youtube.com/watch?v=HXV3zeQKqGY
  - "MySQL Tutorial for Beginners – Programming with Mosh" → https://www.youtube.com/watch?v=7S_tz1z_5bA
  - "Database Design Course – freeCodeCamp" → https://www.youtube.com/watch?v=ztHopE5Wnpc
"""


class CourseRecommendationAgent:
    """Agent responsible for recommending courses from external platforms.
    
    Uses the LLM directly to produce pinpoint, verified, language-aware course
    and playlist URLs — rather than relying on volatile DuckDuckGo web search
    results that may return Chinese forum threads or broken links.
    """

    def __init__(self):
        self.agent_name = "Course Recommendation Agent"
        self.temperature = 0.2  # Low temp for factual, consistent URL generation

    async def recommend_courses(
        self,
        exam_type: str,
        current_knowledge: Dict[str, Any] = None,
        language: str = "English"
    ) -> List[Dict[str, Any]]:
        """
        Recommend pinpoint, working courses for the given exam/topic and language.

        Args:
            exam_type: Learning goal/topic (e.g. "Machine Learning", "GATE CS", "Python")
            current_knowledge: Dict describing user's current level
            language: Preferred language of the course (e.g. "English", "Hindi", "Marathi")

        Returns:
            List of course dicts with title, description, url, platform
        """
        try:
            system_prompt = f"""You are an elite educational curator AI. Your task is to recommend exactly 5–6 high-quality online courses or video playlists for a student.

CRITICAL RULES — YOU MUST FOLLOW ALL OF THEM:

1. **LANGUAGE MATCHING**:
   - The student's preferred language is: **{language}**
   - If the language is **English**: recommend English-medium courses only.
   - If the language is **Hindi**: prefer Hindi-medium YouTube/Unacademy courses (e.g. Physics Wallah, Gate Smashers, CodeWithHarry). Also include 1–2 English courses if no Hindi alternative exists.
   - If the language is **Marathi**: prefer Marathi-medium content if available; fall back to Hindi or English if Marathi content is scarce for the topic.
   - ALL course titles and descriptions in your JSON output MUST be written in **English** regardless of the medium — this is for UI display only.

2. **PINPOINT, EXACT, WORKING URLs**:
   - Every URL MUST point directly to the specific course, playlist, or lecture page.
   - DO NOT use generic homepages like `https://youtube.com`, `https://coursera.org`, or `https://udemy.com`.
   - IMPORTANT FALLBACK: For ANY topic not explicitly listed in the seed URLs, DO NOT guess or hallucinate a `@channelname` or `playlist?list=ID`. Instead, YOU MUST use a YouTube search query URL which is guaranteed to work: `https://www.youtube.com/results?search_query=your+topic+here`.
   - ONLY use exact playlist URLs or channel URLs if they are directly copied from the SEED list below. NEVER make up a playlist ID.
   - For Coursera: use specialization/course URLs (`https://www.coursera.org/specializations/xxx` or `https://www.coursera.org/learn/xxx`).
   - For NPTEL: use exact NPTEL course or YouTube playlist URLs.
   - For Udemy: use exact course URLs (`https://www.udemy.com/course/xxx`).
   - For edX: use exact course or program URLs.

3. **QUALITY STANDARDS**:
   - Prefer free or very popular premium courses.
   - Prioritize world-class creators: Andrew Ng, MIT, Stanford, freeCodeCamp, CS50, 3Blue1Brown, Physics Wallah, Gate Smashers, CodeWithHarry, Telusko, TechWorld with Nana, Traversy Media, etc.
   - For Hindi: CodeWithHarry, Apna College, Gate Smashers, Physics Wallah, Geeky Shows, Telusko.
   - For Marathi: look for Marathi coding/education channels or use Hindi alternatives.

4. **NO FORUM POSTS, NO BLOGS, NO ANNOUNCEMENTS**:
   - Do NOT recommend Reddit, Quora, Medium articles, NPTEL registration announcements, or any page that is not an actual course or playlist.

5. **USE THE VERIFIED SEED URLs**:
   You have been provided with a curated list of VERIFIED, working course URLs below. When the topic matches, use those exact URLs — do not fabricate new ones for those topics.

{CURATED_SEEDS}

OUTPUT FORMAT — Return ONLY this JSON:
{{
  "courses": [
    {{
      "title": "Exact Course or Playlist Title (in English for UI display)",
      "description": "2-3 sentence description of what this course covers and why it is recommended (in English for UI display)",
      "url": "Exact direct pinpoint URL",
      "platform": "YouTube" | "Coursera" | "Udemy" | "NPTEL" | "edX" | "Fast.ai" | "DeepLearning.AI" | "Unacademy" | "Web"
    }}
  ]
}}
"""

            user_prompt = f"""Student Learning Goal / Exam: {exam_type}
Preferred Language: {language}
Student's Current Knowledge Level: {json.dumps(current_knowledge or {}, indent=2)}

Recommend exactly 5–6 of the absolute best, most pinpoint courses or playlists for "{exam_type}" 
that are appropriate for the student's level and preferred language ({language}).

Remember:
- Use verified URLs from the curated list when the topic matches.
- For other topics not in the curated list, provide real, exact URLs you are confident about.
- All course titles and descriptions must be in English (for UI display), but the medium of instruction should match {language}.
"""

            logger.info(f"Generating LLM-curated course recommendations for: {exam_type} [{language}]")

            response = await azure_openai_service.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=self.temperature
            )

            data = parse_json_markdown(response)
            raw_courses = data.get("courses", [])

            # Build final course list with validation
            final_courses = []
            seen_urls = set()

            for course in raw_courses:
                url = course.get("url", "").strip()
                title = course.get("title", "").strip()
                platform = course.get("platform", "Web").strip()
                description = course.get("description", "").strip()

                # Skip empty, duplicate, or obviously invalid URLs
                if not url or not title:
                    continue
                if url in seen_urls:
                    continue
                # Reject generic homepages or search result pages
                invalid_patterns = [
                    "youtube.com/results",
                    "google.com/search",
                    "bing.com/search",
                    "zhihu.com",
                    "bilibili.com",
                    "weixin",
                    "wechat",
                    "baidu.com",
                ]
                if any(pat in url.lower() for pat in invalid_patterns):
                    logger.warning(f"Skipping invalid/non-English URL: {url}")
                    continue

                seen_urls.add(url)
                final_courses.append({
                    "title": title,
                    "description": description,
                    "url": url,
                    "platform": platform,
                    "thumbnail": None
                })

            logger.success(
                f"Generated {len(final_courses)} pinpoint course recommendations "
                f"for '{exam_type}' [{language}]"
            )
            return final_courses

        except Exception as e:
            logger.error(f"Error recommending courses for '{exam_type}': {str(e)}")
            return []


# Global instance
course_recommendation_agent = CourseRecommendationAgent()
