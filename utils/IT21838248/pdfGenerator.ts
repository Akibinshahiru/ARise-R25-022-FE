import { GAME_WEIGHTS, getScoreCategory } from '@/config/IT21838248/gameConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const saveHTMLReportToDownloads = async (htmlContent: string) => {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }

    Alert.alert(
      'Report Ready',
      `HTML report saved to app folder. Use Share to move it.`
    );
  } catch (err) {
    console.error('Error saving report:', err);
    Alert.alert('Error', 'Failed to save report');
  }
};

interface GameResult {
  gameId: number;
  gameName: string;
  score: number;
}

interface ReportData {
  childName: string;
  dateOfBirth: string;
  gender: string;
  dateOfAssessment: string;
  reportId: string;
  gameResults: GameResult[];
  finalScore: number;
  category: any;
  age: number;
}

export class PDFReportGenerator {
  static async generateReport(): Promise<string | null> {
    try {
      const reportData = await this.prepareReportData();
      if (!reportData) return null;

      const htmlContent = this.generateHTMLContent(reportData);

      // For now, always use HTML download approach
      await this.downloadHTMLReport(htmlContent, reportData.childName);
      return 'web-download';
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return null;
    }
  }

  private static async prepareReportData(): Promise<ReportData | null> {
    try {
      const userName = await AsyncStorage.getItem('userName');
      const userDOB = await AsyncStorage.getItem('userDOB');
      const userGender = await AsyncStorage.getItem('userGender');
      const progressData = await AsyncStorage.getItem('gameProgress');

      if (!userName || !userDOB || !userGender || !progressData) {
        return null;
      }

      const gameResults = JSON.parse(progressData);

      // Calculate weighted final score
      let weightedScore = 0;
      gameResults.forEach((result: any) => {
        const gameWeight = GAME_WEIGHTS.find((w) => w.gameId === result.gameId);
        if (gameWeight) {
          weightedScore += (result.score * gameWeight.weight) / 100;
        }
      });

      const finalScore = Math.round(weightedScore);
      const category = getScoreCategory(finalScore);

      // Calculate age from DOB
      const age = this.calculateAge(userDOB);

      // Generate unique report ID
      const reportId = `RPT-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      return {
        childName: userName,
        dateOfBirth: userDOB,
        gender: userGender,
        dateOfAssessment: new Date().toLocaleDateString(),
        reportId,
        gameResults,
        finalScore,
        category,
        age,
      };
    } catch (error) {
      console.error('Error preparing report data:', error);
      return null;
    }
  }

  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private static generateHTMLContent(data: ReportData): string {
    const currentDateTime = new Date().toLocaleString();

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dyslexia Assessment Report</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
          color: #333;
        }
        
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content {
          padding: 30px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          color: #1e3a8a;
          font-size: 20px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .child-info {
          background: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
        }
        
        .info-value {
          color: #1f2937;
        }
        
        .games-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .games-table th {
          background: #1e3a8a;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        
        .games-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .games-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .score-cell {
          font-weight: bold;
          text-align: center;
        }
        
        .final-score-row {
          background: #dbeafe !important;
          font-weight: bold;
        }
        
        .final-score-row td {
          border-top: 2px solid #3b82f6;
          color: #1e3a8a;
        }
        
        .diagnostic-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 25px;
          border-radius: 10px;
          border: 2px solid #0ea5e9;
          text-align: center;
        }
        
        .final-score {
          font-size: 36px;
          font-weight: bold;
          color: #1e3a8a;
          margin: 10px 0;
        }
        
        .category {
          font-size: 24px;
          font-weight: bold;
          margin: 15px 0;
          padding: 10px 20px;
          border-radius: 25px;
          display: inline-block;
        }
        
        .category.normal {
          background: #dcfce7;
          color: #166534;
        }
        
        .category.mild-risk {
          background: #fef3c7;
          color: #92400e;
        }
        
        .category.at-risk {
          background: #fed7aa;
          color: #c2410c;
        }
        
        .category.high-risk {
          background: #fecaca;
          color: #dc2626;
        }
        
        .recommendations {
          background: #f0fdf4;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #22c55e;
        }
        
        .recommendations ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .recommendations li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .disclaimer {
          background: #fef2f2;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
          margin-top: 20px;
        }
        
        .disclaimer h3 {
          color: #dc2626;
          margin-top: 0;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          background: #f8fafc;
          color: #6b7280;
          font-size: 14px;
        }
        
        .description {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <h1>Dyslexia Assessment Report</h1>
          <p>KidZo Learning Games - Early Screening Tool</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="child-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Child's Name:</span>
                  <span class="info-value">${data.childName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date of Birth:</span>
                  <span class="info-value">${data.dateOfBirth}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Age:</span>
                  <span class="info-value">${data.age} years</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Gender:</span>
                  <span class="info-value">${data.gender}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date of Assessment:</span>
                  <span class="info-value">${data.dateOfAssessment}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Report ID:</span>
                  <span class="info-value">${data.reportId}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="description">
              This report summarizes the results of a diagnostic assessment conducted using a set of 
              interactive games designed to screen for early indicators of dyslexia in children aged 2 to 8 years. 
              The games assess phonological awareness, letter recognition, visual memory, working 
              memory, and reversal tendencies.
              <br><br>
              <strong>Note:</strong> This is a screening tool, not a substitute for a full clinical diagnosis.
            </div>
          </div>
          
          <div class="section">
            <h2>Game-wise Performance</h2>
            <table class="games-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Weight (out of 100)</th>
                  <th>Raw Score (0-100)</th>
                  <th>Weighted Contribution</th>
                  <th>Focus Points of the Game</th>
                </tr>
              </thead>
              <tbody>
                ${this.generateGameRows(data.gameResults)}
                <tr class="final-score-row">
                  <td><strong>Final Score</strong></td>
                  <td><strong>100</strong></td>
                  <td class="score-cell"><strong>${
                    data.finalScore
                  }/100</strong></td>
                  <td><strong>${data.finalScore}</strong></td>
                  <td><strong>—</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>Diagnostic Category</h2>
            <div class="diagnostic-section">
              <div class="final-score">${data.finalScore} / 100</div>
              <div class="category ${this.getCategoryClass(
                data.category.category
              )}">
                ${data.category.category} - ${data.category.riskLevel}
              </div>
              <p><strong>Result for ${data.childName}:</strong> ${
      data.category.riskLevel
    }</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Categories Reference</h2>
            <ul>
              <li><strong>80–100:</strong> Normal / No Dyslexia</li>
              <li><strong>60–79:</strong> Mild Risk (Monitor)</li>
              <li><strong>40–59:</strong> At Risk (Moderate Indicators)</li>
              <li><strong>0–39:</strong> High Risk (Likely Dyslexia)</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>Recommendations</h2>
            <div class="recommendations">
              <p><strong>Based on the assessment results:</strong></p>
              <ul>
                ${this.generateRecommendations(data.category.category)}
              </ul>
              <p><strong>Suggested Action:</strong> ${
                data.category.suggestedAction
              }</p>
            </div>
          </div>
          
          <div class="disclaimer">
            <h3>Notes & Disclaimer</h3>
            <p>
              This assessment provides a screening indicator only. It does not replace a full 
              medical/educational evaluation. Parents are advised to consult specialists if the child falls into 
              "At Risk" or "High Risk" categories.
            </p>
          </div>
        </div>
        
        <div class="footer">
          Report Generated on ${currentDateTime}
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private static generateGameRows(gameResults: GameResult[]): string {
    const gameDetails = [
      {
        id: 1,
        name: 'Letter Tracing',
        weight: 25,
        focus: 'Reversals, stroke and curve accuracy',
      },
      {
        id: 2,
        name: 'Sound–Letter',
        weight: 25,
        focus: 'Phonological awareness',
      },
      {
        id: 3,
        name: 'Same or Different',
        weight: 15,
        focus: 'Visual discrimination',
      },
      {
        id: 4,
        name: 'Hidden Letter Hunt',
        weight: 20,
        focus: 'Memory + recall',
      },
      {
        id: 5,
        name: 'Color Matching',
        weight: 15,
        focus: 'Sequencing, working memory',
      },
    ];

    return gameDetails
      .map((game) => {
        const result = gameResults.find((r) => r.gameId === game.id);
        const score = result ? result.score : 0;
        const weightedContribution = Math.round((score * game.weight) / 100);

        return `
        <tr>
          <td>${game.name}</td>
          <td>${game.weight}</td>
          <td class="score-cell">${score}</td>
          <td class="score-cell">${weightedContribution}</td>
          <td>${game.focus}</td>
        </tr>
      `;
      })
      .join('');
  }

  private static getCategoryClass(category: string): string {
    switch (category) {
      case 'Normal':
        return 'normal';
      case 'Mild Risk':
        return 'mild-risk';
      case 'At Risk':
        return 'at-risk';
      case 'High Risk':
        return 'high-risk';
      default:
        return 'normal';
    }
  }

  private static generateRecommendations(category: string): string {
    switch (category) {
      case 'Normal':
        return '<li>Encourage continued reading & playful literacy exposure.</li><li>Continue regular learning activities and re-screen later if needed.</li>';
      case 'Mild Risk':
        return '<li>Provide extra support in phonics and tracing exercises.</li><li>Monitor progress closely with regular practice sessions.</li><li>Consider additional reading support activities.</li>';
      case 'At Risk':
        return '<li>Introduce structured multisensory interventions (phonics, tracing, story-based games).</li><li>Consider professional consultation for targeted intervention strategies.</li><li>Implement daily structured learning activities.</li>';
      case 'High Risk':
        return '<li>Seek a full professional evaluation by a speech-language pathologist or educational psychologist.</li><li>Implement immediate structured intervention programs.</li><li>Consider specialized educational support.</li>';
      default:
        return '<li>Continue monitoring and provide appropriate support based on individual needs.</li>';
    }
  }

  private static async downloadHTMLReport(
    htmlContent: string,
    childName: string
  ): Promise<void> {
    await saveHTMLReportToDownloads(htmlContent);
    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dyslexia_Assessment_${childName}_${
        new Date().toISOString().split('T')[0]
      }.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(
        htmlContent
      )}`;
      console.log('Report generated as HTML content');
    }
  }
}
