{{ ... }}
                  {/* Update links to use the new client-side route */}
                  <div className="flex justify-between items-end mt-2">
                    <div className="text-sm text-gray-500">
                      {new Date(analysis.analysisTimestamp).toLocaleDateString()} • 
                      {analysis.totalCommentsAnalyzed} comments analyzed
                    </div>
                    <Link 
                      href={`/analysis-client?id=${analysis.analysisId}`} 
                      className="text-sm font-medium text-blue-500 hover:text-blue-600"
                    >
                      View Analysis
                    </Link>
                  </div>
{{ ... }}
