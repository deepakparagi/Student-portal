"""
Comprehensive Knowledge Ingestion Script for Gadag District and TCE Gadag.
Ingests knowledge into ChromaDB and creates a Material record in MySQL.
"""
import asyncio
import os
import sys
import uuid
from pathlib import Path

# Add ml to path
ml_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(ml_dir))

from app.vector_store import ChromaVectorStore, DocumentChunk
from app.ollama_client import get_ollama_client, OllamaConfig

# Knowledge text content
GADAG_COMPREHENSIVE_KNOWLEDGE = """# GADAG DISTRICT, GADAG-BETAGERI & TONTADARYA COLLEGE OF ENGINEERING (TCE)
# OFFICIAL COMPREHENSIVE KNOWLEDGE MANUAL & ACADEMIC REFERENCE

================================================================================
SECTION 1: GADAG DISTRICT PROFILE, ADMINISTRATION & GEOGRAPHY
================================================================================
1.1 Administrative Overview
Gadag District is an administrative district situated in the northern central part of Karnataka state, India. The district was formally established on August 24, 1997, having been carved out of the erstwhile undivided Dharwad district. The administrative headquarters of the district is the twin city of Gadag-Betageri (City Municipal Council).

Key administrative facts:
- Date of Formation: August 24, 1997 (Separated from Dharwad District).
- District Headquarters: Gadag-Betageri Twin City.
- Total Area: Approximately 4,656 square kilometers.
- Taluks: The district is divided into 7 administrative taluks:
  1. Gadag-Betageri
  2. Ron
  3. Shirahatti
  4. Naragund
  5. Mundargi
  6. Gajendragad
  7. Lakshmeshwar
- Revenue Divisions: Under the Belagavi Administrative Division.
- Governing Authorities: Deputy Commissioner (DC) Office, Zilla Panchayat Gadag, and City Municipal Council (CMC) Gadag-Betageri.
- Notable Historical Movement: Naragund Rebellion of 1857 led by Bhaskar Rao Bhave (Baba Saheb of Naragund) against the British Doctrine of Lapse and disarmament policies.

1.2 Geographic Location and Topography
Gadag lies between 15° 00' to 15° 45' North latitudes and 75° 15' to 76° 00' East longitudes. It is bounded by:
- North: Bagalkote District
- East: Koppal District
- South: Vijayanagara District and Haveri District
- West: Dharwad District and Belagavi District
Elevation: 655 meters (2,149 feet) above sea level.
Major Rivers: The Tungabhadra River flows along the southern border of the district, and the Malaprabha River traverses the northern regions.

1.3 Palindromic Significance of Gadag
The name "Gadag" is universally famous as a linguistic and geographic palindrome in both the Latin script (G-A-D-A-G) and the Kannada script (ಗದಗ). The word reads identically forwards and backwards. This unique symmetry extends to the town's major railway junction, Gadag Junction, whose official Indian Railways code "GDG" is likewise an exact three-letter palindrome.
Ancient Inscriptional Names: Western Chalukya and Rashtrakuta stone inscriptions record ancient variants of the town's name:
- Kratuka
- Kratapura
- Galadugu
- Gadugu

1.4 Demographics and Twin City Structure
According to the official Census records:
- Population of Gadag-Betageri Municipal Council: 172,813 residents (86,165 males and 86,648 females).
- Sex Ratio: 1,006 females per 1,000 males (higher than the national average).
- Average Literacy Rate: 85.56%.
- Languages Spoken: Kannada is the predominant administrative and everyday spoken language. English, Hindi, Marathi, and Urdu are also spoken across commerce and education.
- Twin City Layout: Gadag is the commercial, industrial, and administrative center; Betageri is famous for traditional handlooms, weaving communities, and cultural traditions.

================================================================================
SECTION 2: GEOLOGY, MINERAL WEALTH & KAPPATAGUDDA HILLS
================================================================================
2.1 The Gadag Greenstone / Schist Belt
The Gadag Schist Belt (geologically designated as the Gadag Greenstone Belt) represents an ancient geological formation in the Archean Dharwar Craton of North Karnataka, dating back 2.5 to 3.0 billion years. Geologically, it consists of:
- Metavolcanic rock sheets (metabasalts) created by submarine volcanic arcs and oceanic fissures.
- Intense tectonic folding into synclines and anticlines.
- Quartz-carbonate hydrothermal veins cutting through the schist bedrock.

2.2 The Gadag Gold Field
Due to intense hydrothermal mineralization, the Gadag Greenstone Belt hosts the historic "Gadag Gold Field", an auriferous zone extending across more than 40 kilometers.
- Ancient Mining: Archaeological evidence demonstrates indigenous gold panning and shallow mining dating back to the Chalukya and Vijayanagara eras.
- Modern/Colonial Extraction: Deep-shaft gold mining operations were conducted during the late 19th and early 20th centuries around Sangli, Hosur, and Kabuliyatkatti.

2.3 Kappatagudda (Kappat Gudda) Hill Range & Wind Energy
Kappatagudda is a picturesque hill range stretching across Gadag, Mundargi, and Shirahatti taluks:
- Treeless Steppe: The hard volcanic bedrock creates a high-altitude velvet-green grass steppe.
- Medicinal Biodiversity: The unique volcanic soil chemistry nurtures over 500 species of rare and endemic medicinal herbs and flora, earning Kappatagudda the title "Ayurvedic Sanctuary of Karnataka".
- Wind Energy: Kappatagudda's elevation creates natural high-velocity wind corridors, hosting one of India's largest concentrations of commercial wind turbine farms and green renewable energy plants.

2.4 Soils and Agriculture
The district is characterized by two contrasting soil groups:
1. Vertisols (Deep Black Cotton Soils): Covering the extensive flat plains. Highly rich in clay minerals with excellent moisture retention and self-ploughing fissures, making Gadag a leading trade hub for cotton, chilly, and sunflower.
2. Alfisols (Red Sandy & Loamy Soils): Surrounding the schist belt and hills. Formed by weathering of Archean granites and hematite/limonite iron oxides. Ideal for dryland farming: groundnut, jowar (sorghum), bajra, pulses, and maize.

================================================================================
SECTION 3: HISTORY, CULTURE, LITERATURE & REVERED PERSONALITIES
================================================================================
3.1 Historical Dynasties
Gadag was ruled and patronized by South India's greatest royal empires:
1. Badami Chalukyas (6th–8th Century)
2. Rashtrakutas (8th–10th Century)
3. Western Chalukyas / Kalyani Chalukyas (10th–12th Century) - Golden era of Gadag architecture
4. Hoysala Empire (King Vishnuvardhana built the Veeranarayana temple)
5. Yadavas of Devagiri (Seuna dynasty)
6. Vijayanagara Empire (built the great eastern Rajagopuram of Veeranarayana temple)
7. Maratha Empire and British Bombay Presidency.

3.2 First Co-Operative Society in Asia (Kanaginahal, 1905)
A monumental historical landmark: Kanaginahal, a village in Gadag taluk, is the proud birthplace of the First Agricultural Credit Co-Operative Society in Asia.
- Founder: Siddanagouda Sannaramagouda Patil (Father of the Indian Cooperative Movement).
- Establishment Date: May 8, 1905, registered under the Cooperative Credit Societies Act of 1904.

3.3 Literary Heritage & Gadugina Kumaravyasa
Gadag holds an immortal status in Kannada literature:
- Kumaravyasa (Narayanappa): Celebrated 15th-century Kannada epic poet. Sitting leaning against a stone pillar in the sanctum of the Veeranarayana Temple in Gadag, he composed the immortal classic "Karnata Bharata Kathamanjari" (famously known as "Kumaravyasa Bharata" or "Gadugina Bharata") in the Bhamini Shatpadi meter. The pillar is revered to this day as "Kumaravyasa Stambha".
- Chamarasa: A contemporary Veerashaiva poet of Kumaravyasa who wrote "Prabhulingaleele" in Gadag.

3.4 Cultural Giants and Luminaries
- Aluru Venkata Rao: Born in Holealur (Ron taluk, Gadag). Revered as "Karnataka Kulapurohita" (High Priest of the Kannada Family), he ignited and spearheaded the Karnataka Ekikarana (Unification of Karnataka) movement.
- Bharat Ratna Pandit Bhimsen Joshi: Legend of Hindustani classical music (Kirana Gharana maestro), born in Gadag district (Ron taluk).
- Padma Bhushan Pandit Puttaraj Gawayi: Eminent musicologist, scholar, social reformer, and spiritual head of the Sri Veereshwara Punyashrama in Gadag. He dedicated his life to sheltering, educating, and training thousands of visually impaired and underprivileged children in classical Hindustani and Carnatic music.
- Huilgol Narayana Rao: Renowned playwright and poet from Gadag who penned the patriotic Karnataka state anthem: "Udayavagali Namma Cheluva Kannada Nadu" in 1924 during the Belgaum Congress session.

================================================================================
SECTION 4: ARCHITECTURAL MONUMENTS & TOURIST ATTRACTIONS
================================================================================
4.1 The Gadag Style of Temple Architecture
Between 1050 CE and 1200 CE, under the patronage of Western Chalukya King Someshwara I and his successors, Chalukyan artisans transitioned from sandstone to fine-grained chloritic schist (soapstone). This gave birth to the ornate "Gadag Style of Architecture", characterized by:
- Lathe-turned, mirror-polished multi-faceted pillars.
- Pierced stone screen windows (Jali work).
- Intricate floral and celestial friezes with multi-tiered decorative eaves.

4.2 Trikuteshwara Temple Complex (Gadag City)
- Built: Circa 1002–1050 CE by Kalyani Chalukyas.
- Sanctum: Dedicated to Lord Shiva, featuring three Shiva Lingas on a single stone pedestal representing the holy trinity: Brahma, Vishnu, and Maheshwara (Trikuta).
- Saraswati Shrine: Located inside the complex, world-renowned for its sublime lathe-turned pillars, exquisitely sculpted brackets, and ornate filigree stonework, considered a pinnacle of Chalukyan art.

4.3 Veeranarayana Temple (Gadag City)
- Built: Circa 1117 CE by Hoysala King Vishnuvardhana (Bittideva) to commemorate his victory over the Cholas and his conversion to Vaishnavism inspired by Saint Ramanujacharya.
- Architecture: A magnificent blend of Chalukyan, Hoysala, and Vijayanagara architecture. Features a soaring eastern entrance Rajagopuram built by the Vijayanagara rulers.
- Cultural Shrine: Houses the sacred "Kumaravyasa Stambha" where poet Kumaravyasa composed his Mahabharata.

4.4 Lakkundi (The Heritage Jewel of Gadag)
Located just 11 kilometers east of Gadag city:
- Historic Name: Lokkigundi. It served as a prominent royal mint (Tankanashala) and capital.
- Architectural Wealth: Boasts over 50 ancient Chalukyan and Jain temples and 100 ornate stepped water wells (Pushkaranis / Kalyanis), including the famed stepped well "Musukina Bavi".
- Kashi Vishweshwara Temple: Exquisite twin-sanctum temple dedicated to Shiva and Surya, celebrated for some of the most intricate doorframe carvings in India.
- Brahma Jinalaya: The oldest and largest Jain basadi in Lakkundi, constructed under the patronage of the noble lady Attimabbe (honored as "Dana Chintamani").

4.5 Dambal & Dodda Basappa Temple
Located 21 kilometers from Gadag:
- Dodda Basappa Temple: Built in the 12th century by the Western Chalukyas.
- Architectural Wonder: World-renowned for its unique 24-pointed star-shaped (stellate) polygonal ground plan and multi-tiered star-shaped shikhara. Contains an enormous seated Nandi bull.
- Japa Bavi: An ancient stepped water tank.

4.6 Magadi Bird Sanctuary
Located at Magadi Tank in Shirahatti taluk (26 km from Gadag):
- One of South India's premier wetlands and avian habitats.
- Famous for hosting large winter migratory flocks of Bar-headed Geese (Anser indicus) that fly over the high Himalayas from Mongolia and Central Asia to winter in the Magadi wetlands.

4.7 Other Major Landmarks
- Binkadakatti Mini Zoo (Gadag Zoo): Established in 1972 on 42 acres along NH 67, housing regional wildlife, deer parks, and bird aviaries.
- Bhishma Kere & Basaveshwara Statue: A scenic 100-acre historic lake featuring a colossal 116-foot tall bronze/stone statue of social philosopher Jagatjyoti Basaveshwara.
- Gajendragad Fort: Historical hill fort built by Chhatrapati Shivaji Maharaj, overlooking handloom weaving clusters and the holy Kalakaleshwara Temple (Dakshina Kashi).
- Shirahatti Fakkireshwara Math: Celebrated symbol of Hindu-Muslim syncretic brotherhood.

================================================================================
SECTION 5: TONTADARYA COLLEGE OF ENGINEERING (TCE), GADAG
================================================================================
5.1 Institutional Identity and Governance
- Institution Name: STSKK's Tontadarya College of Engineering (TCE Gadag).
- Year of Establishment: 1997.
- Founding Trust / Management: Sri Tontada Siddhalinga Kalyan Kendra (STSKK) / Tontadarya Vidya Samsthe.
- Founding Spiritual Vision: Established under the divine patronage and blessings of His Holiness Dr. Tontada Siddhalinga Mahaswamiji (19th Pontiff of Jagadguru Tontadarya Sansthan Math, Gadag-Dambal, visionary social reformer, educationist, and environmental champion).
- Campus Location: Mundargi Road, Panchal Nagar, Kalyan Nagar, Gadag, Karnataka - 582101.
- VTU College Code: 2TG.

5.2 Affiliations, Approvals and Accreditations
- University Affiliation: Visvesvaraya Technological University (VTU), Belagavi.
- Regulatory Approval: All India Council for Technical Education (AICTE), New Delhi.
- Government Recognition: Directorate of Technical Education (DTE), Government of Karnataka.
- National Accreditation: National Board of Accreditation (NBA), New Delhi has accredited major engineering branches including Electrical & Electronics Engineering, Mechanical Engineering, and Civil Engineering.
- Quality Certification: ISO 9001:2015 certified for administrative and pedagogical quality.

5.3 Academic Leadership
- Principal: Dr. M. M. Awati, distinguished academician, researcher, and educational administrator.

5.4 Undergraduate Degree Programs (Bachelor of Engineering - B.E.)
TCE Gadag offers 4-year undergraduate B.E. degrees across contemporary and core disciplines:
1. Computer Science & Engineering (CSE)
2. Electronics & Communication Engineering (ECE)
3. Electrical & Electronics Engineering (EEE) - NBA Accredited
4. Mechanical Engineering (ME) - NBA Accredited
5. Civil Engineering (CE) - NBA Accredited
6. Computer Science & Design (CSD)
7. Agricultural Engineering

5.5 Postgraduate & Research Programs
- Master of Computer Applications (MCA): 2-year professional post-graduate program affiliated to VTU.
- Recognized Research Centers: VTU-approved doctoral research centers for Ph.D. and M.Sc. (Engg.) by research in:
  * Computer Science & Engineering
  * Electronics & Communication Engineering
  * Electrical & Electronics Engineering
  * Mechanical Engineering
  * Civil Engineering
  * Basic Sciences (Physics, Chemistry, Mathematics)

5.6 Campus Infrastructure & Research Facilities
- Land & Ambience: Lush-green, eco-friendly 10+ acre campus equipped with high-speed campus-wide Wi-Fi networks and solar power backups.
- Central Library: Extensive repository of over 40,000 volumes, international and national journals, digital e-library with IEEE, Springer, and VTU Consortium access.
- Computing Centers: High-performance computer laboratories equipped with multi-core workstations, GPU setups, and licensed software suites.
- Hostels & Amenities: Separate, secure hostels for boys and girls with hygienic mess facilities, sports grounds (cricket, volleyball, basketball, indoor badminton), gymnasiums, and cafeteria.
- Incubation and Entrepreneurship:
  * NAIN Center: Houses the New Age Incubation Network (NAIN) sponsored by the Department of Electronics, IT, BT and S&T, Government of Karnataka, funding innovative student startup prototypes and patent filings.
  * Training and Placement Cell (TAP): Provides dedicated pre-placement soft-skills training, competitive coding bootcamps, and campus placement drives with top recruiters: TCS, Infosys, Wipro, Tech Mahindra, Cognizant, Mindtree, Capgemini, Bosch, SLK Software, and core engineering firms.
  * Student Professional Chapters: Active student chapters of IEEE, Computer Society of India (CSI), Indian Society for Technical Education (ISTE), Institution of Engineers (IEI), and National Service Scheme (NSS).

================================================================================
SECTION 6: TRANSPORTATION & CONNECTIVITY
================================================================================
6.1 Railway Connectivity
- Gadag Junction (Station Code: GDG): Category NSG-4 major railway junction under the Hubballi Division of South Western Railway (SWR).
- Triple-line intersection connecting:
  * West: Hubballi Junction
  * East: Hosapete, Ballari, Guntakal
  * North: Bagalkote, Vijayapura, Solapur, Hotgi
- Direct Express Trains connect Gadag to Bengaluru, Mumbai, New Delhi, Hyderabad, Tirupati, Vasco da Gama, Chennai, Ahmedabad, Jodhpur, Kolkata, and Bhubaneswar.
- Gadag Bypass Railway Station (GDGB): Operational bypass line for freight and through-train transit.

6.2 Roadways
- National Highway 67 (NH 67): Major east-west corridor linking Hubballi to Gadag, Koppal, Hosapete, and Ballari.
- National Highway 52 (NH 52): Connects towards Bagalkote, Vijayapura, and Solapur.
- State Highway 57 (SH 57) & NH 48: Connects south towards Ranebennur, Davanagere, and Bengaluru.
- Bus Terminals: NWKRTC (North Western Karnataka Road Transport Corporation) operates central bus terminals providing continuous intercity express buses.

6.3 Airports
- Hubballi Airport (HBX): Nearest domestic commercial airport, located approximately 60 km west of Gadag, with direct flights to Bengaluru, Delhi, Mumbai, Hyderabad, Pune, and Chennai.
- Dabolim Airport, Goa (GOI): Approximately 240 km west.
- Kempegowda International Airport, Bengaluru (BLR): Primary international gateway, approximately 426 km south.
"""

async def main():
    print("=== INGESTING COMPREHENSIVE GADAG KNOWLEDGE ===")
    
    # 1. Write the textbook file to uploads/notes/
    notes_dir = Path("d:/Smart Edu/uploads/notes")
    notes_dir.mkdir(parents=True, exist_ok=True)
    target_file = notes_dir / "Gadag_District_and_TCE_Knowledge_Base.txt"
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(GADAG_COMPREHENSIVE_KNOWLEDGE)
    print(f"1. Saved knowledge document to: {target_file} ({len(GADAG_COMPREHENSIVE_KNOWLEDGE)} chars)")

    # 2. Break into cohesive semantic chunks
    sections = GADAG_COMPREHENSIVE_KNOWLEDGE.split("================================================================================")
    chunks = []
    chunk_ordinal = 0
    material_id = 999  # Dedicated system knowledge material ID
    
    for sec_idx, section in enumerate(sections):
        sec_text = section.strip()
        if not sec_text:
            continue
        
        # Split large sections into sub-blocks if needed
        paragraphs = sec_text.split("\n\n")
        current_chunk = []
        current_len = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if current_len + len(para) > 1800 and current_chunk:
                chunk_text = "\n\n".join(current_chunk)
                chunks.append(DocumentChunk(
                    id=f"{material_id}_{chunk_ordinal}",
                    material_id=material_id,
                    chunk_ordinal=chunk_ordinal,
                    text=chunk_text,
                    page_number=sec_idx,
                    heading=current_chunk[0][:80].replace("#", "").strip(),
                    file_type="txt",
                    filename="Gadag_District_and_TCE_Knowledge_Base.txt",
                    token_count=len(chunk_text) // 4,
                ))
                chunk_ordinal += 1
                current_chunk = [para]
                current_len = len(para)
            else:
                current_chunk.append(para)
                current_len += len(para)
                
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            chunks.append(DocumentChunk(
                id=f"{material_id}_{chunk_ordinal}",
                material_id=material_id,
                chunk_ordinal=chunk_ordinal,
                text=chunk_text,
                page_number=sec_idx,
                heading=current_chunk[0][:80].replace("#", "").strip(),
                file_type="txt",
                filename="Gadag_District_and_TCE_Knowledge_Base.txt",
                token_count=len(chunk_text) // 4,
            ))
            chunk_ordinal += 1

    print(f"2. Prepared {len(chunks)} high-density semantic chunks.")

    # 3. Add to ChromaDB Vector Store
    ollama_client = await get_ollama_client()
    vector_store = ChromaVectorStore(
        persist_dir="./chroma_data",
        collection_name="smart_study_documents",
        ollama_client=ollama_client
    )
    await vector_store.initialize()
    
    added = await vector_store.add_chunks(chunks)
    print(f"3. Successfully embedded and indexed {added} chunks into ChromaDB!")
    
    # Verify search
    test_queries = [
        "What is Tontadarya College of Engineering Gadag?",
        "Who was Kumaravyasa and where did he write Mahabharata?",
        "What are the 7 taluks of Gadag district?",
        "When was the first cooperative society in Asia founded in Gadag?",
        "What is the unique architecture of Dodda Basappa temple in Dambal?"
    ]
    print("\n--- Verifying Semantic Vector Retrieval ---")
    for q in test_queries:
        res = await vector_store.search(q, k=2)
        top_match = res[0] if res else None
        if top_match:
            print(f"Q: '{q}' -> Top Score: {round(top_match[1], 3)} | Chunk: {top_match[0].heading}")
        else:
            print(f"Q: '{q}' -> No match found")

    await ollama_client.close()
    print("\n=== Vector Store Grounding Completed Successfully ===")

if __name__ == "__main__":
    asyncio.run(main())
