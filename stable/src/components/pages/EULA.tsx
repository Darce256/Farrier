import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const EULAContent: React.FC = () => {
  return (
    <ScrollArea className="h-[70vh] w-full rounded-md border p-4">
      <div className="pr-4">
        <h1 className="text-2xl font-bold mb-4">
          END USER LICENSE AGREEMENT (EULA)
        </h1>
        <p className="mb-4">Last Updated: 10/18/2024</p>
        <p className="mb-4">
          This End User License Agreement ("Agreement") is a legal agreement
          between you (either an individual or an entity) and JT Evolutions
          ("Company", "we", or "us") for the use of the software product
          BobbySimms ("Software"), which includes related documentation and may
          include associated media, printed materials, and online or electronic
          documentation (collectively, the "Software").
        </p>
        <p className="mb-4">
          By installing, copying, or otherwise using the Software, you agree to
          be bound by the terms of this Agreement. If you do not agree to the
          terms of this Agreement, do not install or use the Software.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. License Grant</h2>
        <p className="mb-4">
          JT Evolutions hereby grants you a limited, non-exclusive,
          non-transferable, and revocable license to use the Software for your
          personal or internal business purposes, subject to the terms and
          conditions of this Agreement. This license does not allow you to
          install or use the Software on any device that you do not own or
          control.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Restrictions</h2>
        <p className="mb-2">You shall not, and shall not permit others to:</p>
        <ol className="list-decimal list-inside mb-4 pl-4">
          <li>
            Copy, modify, or distribute the Software or any part of it, except
            as expressly permitted by this Agreement.
          </li>
          <li>
            Reverse engineer, decompile, or disassemble the Software, except to
            the extent that this restriction is expressly prohibited by
            applicable law.
          </li>
          <li>Rent, lease, or lend the Software.</li>
          <li>Use the Software to develop a competing product or service.</li>
          <li>Use the Software for any illegal or unauthorized purpose.</li>
        </ol>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Ownership</h2>
        <p className="mb-4">
          The Software is licensed, not sold. JT Evolutions retains all
          ownership rights, title, and interest in and to the Software,
          including all intellectual property rights. This Agreement does not
          grant you any rights to any trademarks or service marks of JT
          Evolutions.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. Updates and Maintenance
        </h2>
        <p className="mb-4">
          JT Evolutions may, at its discretion, provide updates, upgrades, or
          patches to the Software. Such updates may be subject to additional
          terms. You agree that the Software may automatically download and
          install updates.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">
          5. Term and Termination
        </h2>
        <p className="mb-4">
          This Agreement is effective until terminated. You may terminate this
          Agreement at any time by deleting or uninstalling the Software. JT
          Evolutions may terminate this Agreement at any time if you violate any
          of the terms. Upon termination, you must cease all use of the Software
          and destroy all copies of it.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">
          6. Disclaimer of Warranties
        </h2>
        <p className="mb-4">
          The Software is provided "as is" without any warranties of any kind,
          either express or implied, including but not limited to implied
          warranties of merchantability, fitness for a particular purpose, or
          non-infringement. JT Evolutions does not warrant that the Software
          will meet your requirements, operate without interruption, or be
          error-free.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">
          7. Limitation of Liability
        </h2>
        <p className="mb-4">
          To the fullest extent permitted by law, in no event will JT Evolutions
          be liable for any indirect, incidental, special, or consequential
          damages, or damages for loss of profits, revenue, data, or use,
          incurred by you or any third party, whether in an action in contract
          or tort, arising from your use of the Software.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify, defend, and hold harmless JT Evolutions its
          affiliates, officers, directors, employees, and agents from and
          against all claims, damages, losses, and expenses arising from your
          use of the Software or your violation of this Agreement.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">9. Governing Law</h2>
        <p className="mb-4">
          This Agreement shall be governed by and construed in accordance with
          the laws of JT Evolutions, without regard to its conflict of laws
          principles.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">
          10. Entire Agreement
        </h2>
        <p className="mb-4">
          This Agreement constitutes the entire understanding between you JT
          Evolutions and supersedes all prior agreements, written or oral, with
          respect to the Software.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">11. Severability</h2>
        <p className="mb-4">
          If any provision of this Agreement is held to be unenforceable, such
          provision shall be reformed only to the extent necessary to make it
          enforceable, and the remaining provisions of this Agreement shall
          remain in full force and effect.
        </p>
        <p className="mt-6 font-semibold">
          By using the Software, you acknowledge that you have read and
          understood this Agreement and agree to be bound by its terms.
        </p>
      </div>
    </ScrollArea>
  );
};

const EULA: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl bg-card rounded-lg shadow-lg">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">
            End User License Agreement
          </h1>
          <EULAContent />
        </div>
      </div>
    </div>
  );
};

export default EULA;
