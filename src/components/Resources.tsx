import {
  ExternalLink,
  Phone,
  BookOpen,
  Recycle,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { RECYCLING_RESOURCES, COUNCIL_LINKS } from "../lib/supabase";

export function Resources() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Resources & Information</h2>
        <p className="text-gray-600">
          Helpful links and information for reporting and recycling
        </p>
      </div>

      {/* Report Issues */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Report Issues
        </h3>
        <div className="space-y-3">
          <a
            href={COUNCIL_LINKS.general}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div>
              <p className="font-medium text-blue-900">Report Fly-Tipping</p>
              <p className="text-sm text-blue-700">
                Report illegal dumping to your local council
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href={COUNCIL_LINKS.hazardous}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">
                  Report Hazardous Waste
                </p>
                <p className="text-sm text-red-700">
                  For dangerous materials that need professional handling
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </a>

          <a
            href="https://www.gov.uk/find-local-council"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div>
              <p className="font-medium text-gray-900">
                Find Your Local Council
              </p>
              <p className="text-sm text-gray-700">
                Get contact details for your local authority
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Recycling Resources */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Recycle className="w-5 h-5 text-green-600" />
          Recycling Information
        </h3>
        <div className="space-y-3">
          {RECYCLING_RESOURCES.map((resource) => (
            <a
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div>
                <p className="font-medium text-green-900">{resource.name}</p>
                <p className="text-sm text-green-700">{resource.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Tips & Best Practices */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Tips & Best Practices
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h4 className="font-medium text-yellow-900 mb-2">Safety First</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Always wear gloves when picking up litter</li>
              <li>• Never touch needles, syringes, or unknown liquids</li>
              <li>• Report hazardous materials instead of cleaning them</li>
              <li>• Use litter pickers for hard-to-reach items</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <h4 className="font-medium text-green-900 mb-2">
              Effective Cleanup
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Bring sturdy bags for collection</li>
              <li>• Separate recyclables when possible</li>
              <li>• Work in teams for larger areas</li>
              <li>• Take before and after photos to inspire others</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <h4 className="font-medium text-blue-900 mb-2">Reporting Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about location and litter type</li>
              <li>• Include photos when possible</li>
              <li>• Mark hazardous materials clearly</li>
              <li>• Follow up if issues aren't resolved</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded">
            <h4 className="font-medium text-purple-900 mb-2">
              Community Impact
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Share your cleanup successes on the feed</li>
              <li>• Encourage neighbors to join community efforts</li>
              <li>• Organize regular cleanup events</li>
              <li>• Educate others about proper waste disposal</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Material Guide */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Quick Material Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2 text-green-900">
              ✓ Safe to Collect
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Plastic bottles and containers</li>
              <li>• Paper and cardboard</li>
              <li>• Glass bottles (if not broken)</li>
              <li>• Metal cans</li>
              <li>• Food packaging</li>
              <li>• Textiles and clothing</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-red-900">✗ Report Only</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Asbestos</li>
              <li>• Needles and syringes</li>
              <li>• Chemicals and paint</li>
              <li>• Batteries (large)</li>
              <li>• Gas cylinders</li>
              <li>• Medical waste</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-900">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Emergency Contacts
        </h3>
        <div className="space-y-2 text-sm">
          <p className="text-red-800">
            <strong>Environmental Agency Incident Hotline:</strong> 0800 80 70
            60
          </p>
          <p className="text-red-800">
            <strong>For emergencies (fire, injury):</strong> 999
          </p>
          <p className="text-red-700 text-xs mt-3">
            Available 24/7 for serious environmental incidents and hazards
          </p>
        </div>
      </section>
    </div>
  );
}
